import React, { useState } from 'react';
import Link from '@mui/material/Link';
import { NavLink } from 'react-router-dom'
import { Container, Typography, TextField, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getBackendURL } from '../../helpers/urlHelpers'

import axios from 'axios';

const HomePage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>('');

    const handleRegister = async () => {
        try {
            await axios.post(getBackendURL('sign_up/'), {
                username: username,
                password: password,
                email: email,
                first_name: firstName,
                last_name: lastName
            }).then(response => {
                navigate('/log_in');
            });

        } catch (error:any) {
            if (error.response) {
                setErrorMessage(error.response.data);
            } else {
                setErrorMessage(t('register.registerError'));
            }
        }
    };

    return (
        <Container>
            <Typography variant="h2" style={{ marginTop: 100 }}>
                {t('register.title')}
            </Typography>
            <TextField
                label={t('register.firstName')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                fullWidth
                margin="normal"
            />
            <TextField
                label={t('register.lastName')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                fullWidth
                margin="normal"
            />
            <TextField
                label={t('register.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="normal"
            />
            <TextField
                label={t('register.username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                margin="normal"
            />
            <TextField
                label={t('register.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
                type="password"
            />
            <Button
                variant="contained"
                color="primary"
                onClick={handleRegister}
                style={{ marginTop: 16 }}
            >
                {t('register.registerButton')}
            </Button>
            {errorMessage && (
                <Typography color="error" style={{ marginTop: 16 }}>
                    {errorMessage}
                </Typography>
            )}
            <Typography style={{ marginTop: 16 }}>
                <Link component={NavLink} to="/log_in/">
                    {t('register.alreadySignedUp')}
                </Link>
            </Typography>
        </Container>
    );
};

export default HomePage;
