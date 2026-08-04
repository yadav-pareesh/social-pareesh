import { useParams } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';

type AuthType = 'login' | 'register';

interface AuthProps {
  type?: AuthType;
}

export const Auth = ({ type: propType }: AuthProps) => {
  const { type } = useParams<{ type: AuthType }>();
  const currentType = propType ?? type ?? 'login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">ChatApp</h1>
          <p className="text-muted-foreground">
            {currentType === 'register'
              ? 'Create a new account'
              : 'Welcome back'}
          </p>
        </div>

        {currentType === 'register' ? <RegisterForm /> : <LoginForm />}
      </div>
    </div>
  );
};