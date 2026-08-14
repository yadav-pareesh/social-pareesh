// components/NotificationSettings.tsx
import { useMemo } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { notificationService } from '@/services/notificationService';
import { Volume2, VolumeX, Bell, BellOff } from 'lucide-react';
import { Navbar } from './Navbar';

export const NotificationSettings = () => {
  const {
    isEnabled,
    soundEnabled,
    vibrateEnabled,
    browserNotificationEnabled,
    toggleNotifications,
    toggleSound,
    toggleVibrate,
    toggleBrowserNotification,
  } = useNotificationStore();

  // Get sounds directly - this will now have data
  const sounds = useMemo(() => {
    const registeredSounds = notificationService.getSounds();
    console.log('Sounds loaded:', registeredSounds); // DEBUG
    return registeredSounds;
  }, []);

  const handleVolumeChange = (key: string, volume: number) => {
    notificationService.registerSound(key, `/sounds/${key}.mp3`, volume);
  };

  const handleTestSound = (key: string) => {
    notificationService.playSound(key);
  };

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Debug: Show if sounds exist */}
        {sounds.length === 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            No sounds loaded. Check notificationService.
          </div>
        )}

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <Bell className="w-5 h-5 text-blue-500" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <h3 className="font-semibold">All Notifications</h3>
                <p className="text-sm text-gray-500">
                  {isEnabled ? 'Notifications are on' : 'Notifications are off'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              className={`px-4 py-2 rounded font-medium transition ${
                isEnabled
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {isEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {isEnabled && (
          <>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Sound</h3>
                  <p className="text-sm text-gray-500">
                    {soundEnabled ? 'Sound is on' : 'Sound is off'}
                  </p>
                </div>
                <button
                  onClick={toggleSound}
                  className={`px-4 py-2 rounded font-medium transition ${
                    soundEnabled
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {soundEnabled ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Vibration</h3>
                  <p className="text-sm text-gray-500">
                    {vibrateEnabled ? 'Vibration is on' : 'Vibration is off'}
                  </p>
                </div>
                <button
                  onClick={toggleVibrate}
                  className={`px-4 py-2 rounded font-medium transition ${
                    vibrateEnabled
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {vibrateEnabled ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Browser Notifications</h3>
                  <p className="text-sm text-gray-500">
                    {browserNotificationEnabled
                      ? 'Notifications are on'
                      : 'Notifications are off'}
                  </p>
                </div>
                <button
                  onClick={toggleBrowserNotification}
                  className={`px-4 py-2 rounded font-medium transition ${
                    browserNotificationEnabled
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {browserNotificationEnabled ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            {soundEnabled && sounds.length > 0 && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Notification Sounds</h3>
                {sounds.map(sound => (
                  <div key={sound.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="capitalize font-medium">{sound.key}</span>
                      <button
                        onClick={() => handleTestSound(sound.key)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Test
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <VolumeX className="w-4 h-4" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        defaultValue={sound.volume || 0.5}
                        onChange={(e) =>
                          handleVolumeChange(sound.key, parseFloat(e.target.value))
                        }
                        className="flex-1"
                      />
                      <Volume2 className="w-4 h-4" />
                    </div>

                    <p className="text-xs text-gray-500">
                      Volume: {Math.round((sound.volume || 0.5) * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};