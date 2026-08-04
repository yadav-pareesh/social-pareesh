import { useNavigate } from 'react-router-dom';
import { AuthenticatedUserProfile } from '../components/profile/AuthenticatedUserProfile';

export const Profile = () => {
  const navigate = useNavigate();

  return <AuthenticatedUserProfile onNavigate={navigate} />;
};