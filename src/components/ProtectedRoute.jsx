import {Navigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

export default function ProtectedRoute({children})
{
    const {user, loading}=useAuth();

    if (loading)
    {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#a3a3a3'
            }}>
                Loading...
            </div>
        );
    }

    if (!user)
    {
        return <Navigate to="/login" replace />;
    }

    return children;
}
