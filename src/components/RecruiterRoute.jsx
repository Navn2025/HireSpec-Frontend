import {Navigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

export default function RecruiterRoute({children})
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

    // Check if user is a recruiter/admin
    const isRecruiter=user?.role==='admin'||user?.role==='company_admin'||user?.role==='company_hr';

    if (!isRecruiter)
    {
        // Redirect non-recruiters to home page
        return <Navigate to="/" replace />;
    }

    return children;
}
