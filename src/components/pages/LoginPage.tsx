import React, { useState } from 'react';
import Link from '@mui/material/Link';
import { NavLink } from 'react-router-dom'
import { Container, Typography, TextField, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import viewerState from '../../state/ViewerState';
import axios from 'axios';

interface LoginPageProps {
    isLoggedin: boolean
}

const LoginPage: React.FC<LoginPageProps> = ({ isLoggedin }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>('');

    const handleLogin = async () => {
        try {
            // If logged in, go to home.
            if (isLoggedin)
                navigate('/');

            // If not logged in, log in using an axios call to the server.
            let response = await axios.post('http://127.0.0.1:8000/login/', {
                username: username,
                password: password
            });
            if (response.status === 200) {
                // Set logged in to true.
                viewerState.setIsLoggedin(true)
                // Save token to localStorage or Redux store
                localStorage.setItem('token', response.data.token);
                // Go to home.
                navigate('/');
            } else {
                setErrorMessage(t('logout.logoutError'));
            }

        } catch (error:any) {
            if (error.response) {
                setErrorMessage(error.response.data.detail);
            } else {
                setErrorMessage(t('login.loginError'));
            }
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
                <Link component={NavLink} to="/register/">
                    {t('login.notSignedUp')}
                </Link>
            </Typography>
        </Container>
    );
};

export default LoginPage;