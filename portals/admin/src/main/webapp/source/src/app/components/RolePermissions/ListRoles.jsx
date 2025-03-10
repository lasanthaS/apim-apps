/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useEffect, useState, useCallback } from 'react';
import ContentBase from 'AppComponents/AdminPages/Addons/ContentBase';
import PermissionAPI from 'AppData/PermissionScopes';
import Grid from '@mui/material/Grid';
import Progress from 'AppComponents/Shared/Progress';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import cloneDeep from 'lodash.clonedeep';
import { FormattedMessage, useIntl } from 'react-intl';
import WarningBase from 'AppComponents/AdminPages/Addons/WarningBase';
import { Alert as MUIAlert } from '@mui/material';
import PermissionsSelector from './TreeView/PermissionsSelector';
import AdminTable from './AdminTable/AdminTable';
import AdminTableHead from './AdminTable/AdminTableHead';
import TableBody from './AdminTable/AdminTableBody';
import ListAddOns from './Commons/ListAddOns';
import DeletePermission from './Commons/DeletePermission';
import AddRoleWizard from './Commons/AddRoleWizard';

const headCells = [
    {
        id: 'role',
        numeric: false,
        disablePadding: false,
        label: <FormattedMessage
            id='RolePermissions.ListRoles.table.column.role'
            defaultMessage='Roles'
        />,
        enableSort: true,
    },
    {
        id: 'permissions',
        numeric: false,
        disablePadding: false,
        label: <FormattedMessage
            id='RolePermissions.ListRoles.table.column.scope.assignments'
            defaultMessage='Scope Assignments'
        />,
    },
];

const pageDesc = (
    <FormattedMessage
        id='RolePermissions.ListRoles.page.description'
        defaultMessage={'Scope assignments are only related to internal, APIM-specific scope assignments. They are not'
        + ' related to role permission assignments in the Management Console.'}
    />
);

/**
 *
 * Extract the scope mapping against REST API applications and User roles.
 * This is to make it easy to iterate over the data
 * @param {Array} permissionMapping Raw scope mapping response received from REST API
 * @returns {Array} Two values, REST API wise scope mappings and User role wise scope mappings
 */
function extractMappings(permissionMapping) {
    const roleMapping = {};
    const appMapping = {};
    for (const mapping of permissionMapping) {
        const {
            roles, tag,
        } = mapping;
        if (appMapping[tag]) {
            appMapping[tag].push(mapping);
        } else {
            appMapping[tag] = [mapping];
        }
        for (const $role of roles) {
            const role = $role.trim && $role.trim();
            if (roleMapping[role]) {
                roleMapping[role].push(mapping);
            } else {
                roleMapping[role] = [mapping];
            }
        }
    }
    return [roleMapping, appMapping];
}

/**
 *
 *
 * @param {*} roleAliases
 * @param {*} scopeMappings
 */
function mergeRoleAliasesAndScopeMappings(roleAliases, scopeMappings) {
    const roleAliasesMap = {};
    for (const roleAlias of roleAliases) {
        const { role, aliases } = roleAlias;
        for (const alias of aliases) {
            // If an alias exist for this role and alias should not equal to same role name
            if (alias && alias !== role) {
                if (roleAliasesMap[alias]) {
                    roleAliasesMap[alias].aliases.push(role);
                } else {
                    roleAliasesMap[alias] = { aliases: [role] };
                }
            } else {
                console.warn('Found role aliases with no mappings(role name)!');
            }
        }
    }
    // Later role names(roleAliasesMap) will overwrite earlier role names(scopeMappings) with the same name.
    return Object.assign(scopeMappings, roleAliasesMap);
}

/**
 *
 *
 * @export @inheritdoc
 * @returns {React.Component} Role -> Permission list component
 */
export default function ListRoles() {
    /*
    Same set of scope mappings, Mapped to corresponding **roles
    i:e
        {
            admin -> [{ name: '', description: '', roles: ''}],
            .
            .
            .
            Internal/Publisher -> [{ name: '', description: '', roles: ''}],
        }
    */
    const [permissionMappings, setPermissionMappings] = useState();
    /*
    Same set of scope mappings, Mapped to corresponding **REST APIs
    i:e
        {
            admin -> [{ name: '', description: '', roles: []}],
            publisher -> [{ name: '', description: '', roles: []}],
            store -> [{ name: '', description: '', roles: []}],
        }
    */
    const [searchPermissionMappings, setSearchPermissionMappings] = useState();
    const [appMappings, setAppMappings] = useState();
    const [roleAliases, setRoleAliases] = useState();
    const [systemScopes, setSystemScopes] = useState();
    const [isOpen, setIsOpen] = useState(false);
    const [hasListPermission, setHasListPermission] = useState(true);
    const intl = useIntl();
    const [errorMessage, setError] = useState(null);
    const [searchText, setSearchText] = useState('');

    const fetchData = useCallback(() => {
        PermissionAPI.getRoleAliases();
        setSearchText('');
        Promise.all([PermissionAPI.getRoleAliases(), PermissionAPI.systemScopes()]).then(
            ([roleAliasesRes, systemScopesRes]) => {
                setSystemScopes(systemScopesRes.body);
                setRoleAliases(roleAliasesRes.body);
            },
        ).catch((error) => {
            // TODO: Proper error handling here ~tmkb
            const { status } = error;
            if (status === 401) {
                setHasListPermission(false);
            } else {
                setError(intl.formatMessage({
                    id: 'RolePermissions.ListRoles.error.retrieving.perm',
                    defaultMessage: 'Error while retrieving permission info',
                }));
                console.error(error);
            }
        });
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (systemScopes && roleAliases) {
            const [roleMapping, appMapping] = extractMappings(systemScopes.list);
            setPermissionMappings(mergeRoleAliasesAndScopeMappings(roleAliases.list, roleMapping));
            setSearchPermissionMappings(mergeRoleAliasesAndScopeMappings(roleAliases.list, roleMapping));
            setAppMappings(appMapping);
        }
    }, [roleAliases, systemScopes]);

    const searchProps = {
        searchPlaceholder: intl.formatMessage({
            id: 'ScopeAssignments.List.search.default',
            defaultMessage: 'Search by Role Name',
        }),
        active: true,
    };

    const onSearch = (searchKey) => {
        const keys = Object.keys(permissionMappings);
        setSearchText(searchKey.target.value);
        const filteredKeys = keys.filter((key) => key.toLowerCase().includes(searchKey.target.value.toLowerCase()));
        const newPermissionMappings = {};
        for (let i = 0; i < filteredKeys.length; i++) {
            newPermissionMappings[filteredKeys[i]] = permissionMappings[filteredKeys[i]];
        }
        setSearchPermissionMappings(newPermissionMappings);
    };

    /*
        No need to create handleScopeMappingUpdate all the time ,
        because we pass the updatedAppMappings, don't take anything from state or props
        This method is in the `ListRoles` component because we need this method when deleting a permission map
    */
    const handleScopeMappingUpdate = useCallback(
        (updatedAppMappings) => {
            return PermissionAPI.updateSystemScopes(updatedAppMappings).then((data) => {
                setSystemScopes(data.body);
            });
        },
        [],
    );
    const handleDeleteRole = (deletedRole, isAlias) => {
        if (!isAlias) {
            const updatedAppMappings = {};
            for (const [app, permissions] of Object.entries(appMappings)) {
                updatedAppMappings[app] = permissions.map((permission) => (
                    { ...permission, roles: permission.roles.filter((role) => role !== deletedRole) }
                ));
            }
            return handleScopeMappingUpdate(updatedAppMappings);
        } else {
            const clonedRoleAliases = cloneDeep(roleAliases.list);
            const updatedRoleAliases = [];
            for (const { role, aliases } of clonedRoleAliases) {
                const filteredAliases = aliases.filter((roleAlias) => roleAlias !== deletedRole);
                if (filteredAliases.length) {
                    updatedRoleAliases.push({ role, aliases: filteredAliases });
                }
            }
            return PermissionAPI.updateRoleAliases(updatedRoleAliases).then((response) => {
                setRoleAliases(response.body);
            });
        }
    };
    if (!hasListPermission) {
        return (
            <WarningBase
                pageProps={{
                    help: null,

                    pageStyle: 'half',
                    title: intl.formatMessage({
                        id: 'RolePermissions.ListRoles.title.role.permissions',
                        defaultMessage: 'Scope Assignments',
                    }),
                }}
                title={(
                    <FormattedMessage
                        id='RolePermissions.ListRoles.permission.denied.title'
                        defaultMessage='Permission Denied'
                    />
                )}
                content={(
                    <FormattedMessage
                        id='RolePermissions.ListRoles.permission.denied.content'
                        defaultMessage={'You do not have enough permission to view Scope Assignments.'
                        + ' Please contact the site administrator.'}
                    />
                )}
            />
        );
    }
    if (!errorMessage && (!permissionMappings || !appMappings)) {
        return (
            <ContentBase pageStyle='paperLess'>
                <Progress message='Resolving user ...' />
            </ContentBase>

        );
    }
    if (errorMessage) {
        return (
            <ContentBase title='Role Permissions'>
                <MUIAlert severity='error'>{errorMessage}</MUIAlert>
            </ContentBase>

        );
    }
    return (
        <ContentBase
            title={intl.formatMessage({
                id: 'RolePermissions.ListRoles.title.role.permissions',
                defaultMessage: 'Scope Assignments',
            })}
            pageDescription={pageDesc}
        >
            <ListAddOns
                searchActive={searchProps.active}
                searchPlaceholder={searchProps.searchPlaceholder}
                filterData={onSearch}
                onRefresh={fetchData}
                searchValue={searchText}
            >
                <Grid item>
                    <Button
                        variant='contained'
                        color='primary'
                        onClick={() => setIsOpen(true)}
                        data-testid='add-scope-mapping'
                    >
                        <FormattedMessage
                            id='RolePermissions.ListRoles.scope.assignment.button'
                            defaultMessage='Add scope mappings'
                        />
                    </Button>
                    {
                        isOpen && (
                            <AddRoleWizard
                                setRoleAliases={setRoleAliases}
                                roleAliases={roleAliases}
                                permissionMappings={permissionMappings}
                                appMappings={appMappings}
                                onClose={() => setIsOpen(false)}
                                onRoleAdd={handleScopeMappingUpdate}
                            />
                        )
                    }
                </Grid>
            </ListAddOns>
            <AdminTable dataIDs={Object.keys(searchPermissionMappings)} multiSelect={false}>
                <AdminTableHead headCells={headCells} />
                <TableBody rows={Object.entries(searchPermissionMappings).map(([role, mapping]) => {
                    return [mapping.aliases ? (
                        <Box display='grid'>
                            {role}
                            <Box
                                mr={2}
                                pr={1}
                                display='inline'
                                fontSize={10}
                                fontWeight='fontWeightLight'
                                data-testid={mapping.aliases}
                            >
                                {mapping.aliases.map((alias) => (
                                    <Box
                                        borderRadius='16px'
                                        borderColor='info.main'
                                        display='inline-block'
                                        border={1}
                                        pr={1}
                                        mr={1}
                                        pl={1}
                                        mt={1}
                                    >
                                        {alias}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ) : role,
                    (
                        <Box component='span' display='block'>
                            {!mapping.aliases && (
                                <PermissionsSelector
                                    role={role}
                                    appMappings={appMappings}
                                    onSave={handleScopeMappingUpdate}
                                />
                            )}
                            <Box pl={1} display='inline'>
                                <DeletePermission
                                    size='small'
                                    variant='outlined'
                                    onDelete={handleDeleteRole}
                                    role={role}
                                    isAlias={mapping.aliases}
                                >
                                    <FormattedMessage
                                        id='RolePermissions.ListRoles.permission.delete.button'
                                        defaultMessage='Delete'
                                    />
                                </DeletePermission>
                            </Box>
                        </Box>),
                    ];
                })}
                />
            </AdminTable>
        </ContentBase>
    );
}
