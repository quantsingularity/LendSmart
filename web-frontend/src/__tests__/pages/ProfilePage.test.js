import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '../../pages/ProfilePage';
import { ApiProvider } from '../../contexts/ApiContext';
import { BlockchainProvider } from '../../contexts/BlockchainContext';

const MockedProfilePage = () => (
    <BrowserRouter>
        <BlockchainProvider>
            <ApiProvider>
                <ProfilePage />
            </ApiProvider>
        </BlockchainProvider>
    </BrowserRouter>
);

describe('ProfilePage', () => {
    test('renders profile page', () => {
        render(<MockedProfilePage />);
        expect(screen.getByText(/My Profile/i)).toBeInTheDocument();
    });

    test('displays personal information section', () => {
        render(<MockedProfilePage />);
        expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
    });
});
