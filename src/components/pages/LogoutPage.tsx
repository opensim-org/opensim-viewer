import Link from '@mui/material/Link';
import { NavLink } from 'react-router-dom'
import { Container, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import viewerState from '../../state/ViewerState';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface LogoutPageProps {
    isLoggedIn: boolean
}

const LogoutPage: React.FC<LogoutPageProps> = ({ isLoggedIn }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [errorMessage, setErrorMessage] = useState<string | null>('');



    useEffect(() => {
        const handleLogout = async () => {
            try {
                if (isLoggedIn) {
                    await axios.post('http://localhost:8000/logout/', null, {
                        headers: {
                          Authorization: `Token ${localStorage.getItem('token')}`,
                        },
                    }).then(response => {
                        if (response.status === 200) {
                            viewerState.setIsLoggedIn(false)
                            // Clear the token from localStorage
                            localStorage.removeItem('token');
                        } else {
                            setErrorMessage(t('logout.logoutError'));
                        }
                    });
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
        handleLogout();
    // The compiler complains about the isLoggedIn variable being used, but not being inside of the dependency array.
    // If we add it to the dependency array, it will trigger unwanted renders, since we change it inside the useEffect,
    // thus, to remove this warning, I add the following line:
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, t])

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