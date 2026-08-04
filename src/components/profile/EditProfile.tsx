import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { usersAPI } from '../../services/api/users';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';

const editProfileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  profilePicUrl: z.string().url().optional().or(z.literal('')),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

interface EditProfileProps {
  onSuccess?: () => void;
}

export const EditProfile = ({ onSuccess }: EditProfileProps) => {
  const { user, setUser } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      username: user?.username || '',
      bio: user?.bio || '',
      profilePicUrl: user?.profilePicUrl || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditProfileFormData) =>
      usersAPI.updateProfile(user!.id, data),
    onSuccess: (response) => {
      if (response.data) {
        setUser(response.data);
        onSuccess?.();
      }
    },
  });

  const onSubmit = (data: EditProfileFormData) => {
    console.log("profile data",data)
    updateMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto">
      <div>
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>
        <Input
          id="username"
          {...register('username')}
        />
        {errors.username && (
          <p className="text-destructive text-sm mt-1">{errors.username.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="text-sm font-medium">
          Bio
        </label>
        <Textarea
          id="bio"
          placeholder="Tell us about yourself..."
          {...register('bio')}
        />
        {errors.bio && (
          <p className="text-destructive text-sm mt-1">{errors.bio.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="profilePicUrl" className="text-sm font-medium">
          Profile Picture URL
        </label>
        <Input
          id="profilePicUrl"
          type="url"
          placeholder="https://example.com/pic.jpg"
          {...register('profilePicUrl')}
        />
        {errors.profilePicUrl && (
          <p className="text-destructive text-sm mt-1">{errors.profilePicUrl.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
};