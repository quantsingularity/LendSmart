import React from 'react';

const Footer = () => {
    return (
        <footer className="footer">
            <p>&copy; {new Date().getFullYear()} LendSmart. All rights reserved.</p>
            {/* Add more footer content if needed, e.g., links to privacy policy, terms of service */}
        </footer>
    );
};

export default Footer;
