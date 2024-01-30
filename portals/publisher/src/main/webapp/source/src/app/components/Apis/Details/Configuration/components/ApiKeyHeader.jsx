/*
 * Copyright (c) 2023, WSO2 LLC. (http://www.wso2.org) All Rights Reserved.
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

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import HelpOutline from '@mui/icons-material/HelpOutline';
import { FormattedMessage } from 'react-intl';
import { isRestricted } from 'AppData/AuthManager';
import { useAPI } from 'AppComponents/Apis/Details/components/ApiContext';
import API from 'AppData/api';
import APIValidation from 'AppData/APIValidation';

/**
 *
 *
 * @export
 * @param {*} props
 * @returns
 */

export default function ApiKeyHeader(props) {
    const { api, configDispatcher } = props;
    const [apiFromContext] = useAPI();
    const [isHeaderNameValid, setIsHeaderNameValid] = useState(true);
    let hasResourceWithSecurity;
    const apiKeyHeaderValue = api.apiKeyHeader;
    if (apiFromContext.apiType === API.CONSTS.APIProduct) {
        const apiList = apiFromContext.apis;
        for (const apiInProduct in apiList) {
            if (Object.prototype.hasOwnProperty.call(apiList, apiInProduct)) {
                hasResourceWithSecurity = apiList[apiInProduct].operations.findIndex(
                    (op) => op.authType !== 'None',
                ) > -1;
                if (hasResourceWithSecurity) {
                    break;
                }
            }
        }
    } else {
        hasResourceWithSecurity = apiFromContext.operations.findIndex((op) => op.authType !== 'None') > -1;
    }
    if (!hasResourceWithSecurity && api.apiKeyHeader !== '') {
        configDispatcher({ action: 'apiKeyHeader', value: '' });
    }

    function validateHeader(value) {
        const headerValidity = APIValidation.apiKeyHeader.required()
            .validate(value, { abortEarly: false }).error;
        if (headerValidity === null) {
            setIsHeaderNameValid(true);
            configDispatcher({ action: 'saveButtonDisabled', value: false });
        } else {
            setIsHeaderNameValid(false);
            configDispatcher({ action: 'saveButtonDisabled', value: true });
        }
    }

    return (
        <Grid container spacing={1} alignItems='center'>
            <Grid item xs={11}>
                <TextField
                    disabled={isRestricted(['apim:api_create'], apiFromContext) || !hasResourceWithSecurity}
                    id='outlined-name'
                    label={(
                        <FormattedMessage
                            id='Apis.Details.Configuration.Configuration.apiKey.header.label'
                            defaultMessage='ApiKey Header'
                        />
                    )}
                    value={hasResourceWithSecurity ? apiKeyHeaderValue : ' '}
                    error={!isHeaderNameValid}
                    helperText={
                        (!isHeaderNameValid)
                        && (
                            <FormattedMessage
                                id='Apis.Details.Configuration.ApiKeyHeader.helper.text'
                                defaultMessage='ApiKey header name cannot contain spaces or special characters'
                            />
                        )
                    }
                    InputProps={{
                        id: 'itest-id-apiKeyHeaderName-input',
                        onBlur: ({ target: { value } }) => {
                            validateHeader(value);
                        },
                    }}
                    margin='normal'
                    variant='outlined'
                    onChange={({ target: { value } }) => configDispatcher({
                        action: 'apiKeyHeader',
                        value: value === '' ? 'ApiKey' : value })}
                    style={{ display: 'flex' }}
                />
            </Grid>
            <Grid item xs={1}>
                <Tooltip
                    title={(
                        <FormattedMessage
                            id='Apis.Details.Configuration.Configuration.ApiKeyHeader.tooltip'
                            defaultMessage={
                                ' The header name that is used to send the api key '
                                + 'information. "ApiKey" is the default header.'
                            }
                        />
                    )}
                    aria-label='ApiKey Header'
                    placement='right-end'
                    interactive
                >
                    <HelpOutline />
                </Tooltip>
            </Grid>
        </Grid>
    );
}

ApiKeyHeader.propTypes = {
    api: PropTypes.shape({}).isRequired,
    configDispatcher: PropTypes.func.isRequired,
};
