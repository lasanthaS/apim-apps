import React from 'react';
import { useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { FormattedMessage } from 'react-intl';
import useMediaQuery from '@material-ui/core/useMediaQuery';

const useStyles = makeStyles({
    root: {
        flexGrow: 1,
    },
});

const Onboarding = (props) => {
    const { title, subTitle, children } = props;
    const theme = useTheme();
    const isXsOrBelow = useMediaQuery(theme.breakpoints.down('xs'));
    const { root } = useStyles();

    return (
        <div className={root}>
            <Grid
                container
                direction='column'
                justify='center'
            >
                <Grid item xs={12}>
                    <Box pt={isXsOrBelow ? 2 : 7} />
                </Grid>
                <Grid item md={12}>
                    <Typography display='block' gutterBottom align='center' variant='h4' component='h1'>
                        {title}
                        <Box color='text.secondary' pt={2}>
                            <Typography display='block' gutterBottom align='center' variant='body1'>
                                {subTitle}
                            </Typography>
                        </Box>
                    </Typography>
                </Grid>

                <Grid item xs={12}>
                    <Box pt={isXsOrBelow ? 2 : 7} pb={5} mx={isXsOrBelow ? 12 : 3}>
                        <Grid
                            container
                            direction='row'
                            justify='center'
                            alignItems='flex-start'
                        >
                            {children}
                        </Grid>
                    </Box>
                </Grid>
            </Grid>
        </div>

    );
};

Onboarding.defaultProps = {
    title: (
        <FormattedMessage
            id='Apis.Listing.SampleAPI.SampleAPI.create.new'
            defaultMessage='Let’s get started !'
        />
    ),
    subTitle: null,
};
export default Onboarding;
