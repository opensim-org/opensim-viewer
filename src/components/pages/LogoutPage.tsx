import Link from '@mui/material/Link';
import { NavLink } from 'react-router-dom'
import { Container, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react'
import { Auth } from 'aws-amplify';
import { useModelContext } from '../../state/ModelUIStateContext';

interface LogoutPageProps {
    isLoggedIn: boolean
}

const LogoutPage: React.FC<LogoutPageProps> = ({ isLoggedIn }) => {
    const { t } = useTranslation();
    const viewerState = useModelContext().viewerState;

    const [errorMessage] = useState<string | null>('');

    useEffect(() => {
      const signOut = async () => {
        try {
          await Auth.signOut();
          viewerState.setIsLoggedIn(false);
        } catch (error) {
          console.error('Error during sign out:', error);
        }
      }

      signOut();
    }, [viewerState]);

    return (
        <Container>
            <Typography variant="h4" style={{ marginTop: 100 }}>
                {t('logout.success')}
            </Typography>
            <Typography style={{ marginTop: 16 }}>
                <Link component={NavLink} to="/">
                    {t('logout.mainPage')}
                </Link>
            </Typography>
            {errorMessage && (
                <Typography color="error" style={{ marginTop: 16 }}>
                    {errorMessage}
                </Typography>
            )}
        </Container>
    );
};

export default LogoutPage;