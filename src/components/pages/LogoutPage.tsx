import Link from '@mui/material/Link';
import { NavLink } from 'react-router-dom'
import { Container, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import viewerState from '../../state/ViewerState';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface LogoutPageProps {
    isLoggedin: boolean
}

const LogoutPage: React.FC<LogoutPageProps> = ({ isLoggedin }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [errorMessage, setErrorMessage] = useState<string | null>('');

    const handleLogout = async () => {
        try {
            if (isLoggedin) {
                let response = await axios.post('http://localhost:8000/logout/', null, {
                    headers: {
                      Authorization: `Token ${localStorage.getItem('token')}`,
                    },
                });
                if (response.status === 200) {
                    viewerState.setIsLoggedin(false)
                    // Clear the token from localStorage
                    localStorage.removeItem('token');
                } else {
                    setErrorMessage(t('logout.logoutError'));
                }
            } else {
                navigate('/log_in');
            }
        } catch (error:any) {
            if (error.response) {
                setErrorMessage(error.response.data.detail);
            } else {
                setErrorMessage(t('logout.logoutError'));
            }
        }
    };

    useEffect(() => {
        handleLogout();
    }, [])

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