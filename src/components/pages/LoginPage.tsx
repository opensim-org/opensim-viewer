import React, { useState } from 'react';
import { NavLink } from 'react-router-dom'
import { Container, Typography, TextField, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import viewerState from '../../state/ViewerState';
import { Auth  } from 'aws-amplify';

interface LoginPageProps {
    isLoggedIn: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ isLoggedIn }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>('');

    const handleLogin = async () => {
        try {
            // If not logged in, log in using Amplify Auth.
            await Auth.signIn(username, password);
            viewerState.setIsLoggedIn(true);

            // Go to home.
            navigate('/');
        } catch (error) {
            setErrorMessage(t('login.loginError'));
        }
    };

    return (
        <Container>
            <Typography variant="h2" style={{ marginTop: 100 }}>
                {t('login.title')}
            </Typography>
            <TextField
                label={t('login.username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                margin="normal"
            />
            <TextField
                label={t('login.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
                type="password"
            />
            <Button
                variant="contained"
                color="primary"
                onClick={handleLogin}
                style={{ marginTop: 16 }}
            >
                {t('login.loginButton')}
            </Button>
            {errorMessage && (
                <Typography color="error" style={{ marginTop: 16 }}>
                    {errorMessage}
                </Typography>
            )}
            <Typography style={{ marginTop: 16 }}>
                <NavLink to="/register/">{t('login.notSignedUp')}</NavLink>
            </Typography>
        </Container>
    );
};

export default LoginPage;
