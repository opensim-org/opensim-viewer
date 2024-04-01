import React from 'react';

const withLayout = (WrappedComponent) => {
    return function WithLayout(props) {
        if (window.location.href.indexOf("kiosk") === -1) {
            require('./App.css');
        }
        else {
            require('./gui.css');
        }
        // Add layout-related logic here
        return <WrappedComponent {...props} />;
    };
};

export default withLayout;