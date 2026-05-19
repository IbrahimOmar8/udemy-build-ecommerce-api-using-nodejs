import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';

export default function AccountTab() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  if (!user) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <View style={{ padding: 24, alignItems: 'center', marginTop: 40 }}>
          <Ionicons name="person-circle-outline" size={80} color="#9ca3af" />
          <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 12 }}>
            Welcome to LearnHub
          </Text>
          <Text style={{ color: '#6b7280', marginTop: 6, marginBottom: 16, textAlign: 'center' }}>
            Log in or create an account to start learning.
          </Text>
          <Pressable
            onPress={() => router.push('/auth/login')}
            style={{
              backgroundColor: '#243df5',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              marginBottom: 10,
              width: '100%',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>
              Log in
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/auth/register')}
            style={{
              borderColor: '#243df5',
              borderWidth: 1,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              width: '100%',
            }}
          >
            <Text style={{ color: '#243df5', fontWeight: '600', textAlign: 'center' }}>
              Sign up
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#e5e7eb',
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#243df5',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 22 }}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>{user.name}</Text>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>{user.email}</Text>
            <Text
              style={{
                marginTop: 4,
                paddingHorizontal: 8,
                paddingVertical: 2,
                backgroundColor: '#dbe5ff',
                color: '#1c2a89',
                fontSize: 10,
                fontWeight: '600',
                borderRadius: 4,
                alignSelf: 'flex-start',
                textTransform: 'uppercase',
              }}
            >
              {user.role}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <MenuItem
            icon="trophy-outline"
            label="My certificates"
            onPress={() => {}}
          />
          <MenuItem icon="cart-outline" label="My cart" onPress={() => {}} />
          <MenuItem icon="heart-outline" label="Wishlist" onPress={() => {}} />
          <MenuItem
            icon="log-out-outline"
            label="Log out"
            onPress={async () => {
              await logout();
              router.replace('/tabs');
            }}
            danger
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: '#e5e7eb',
      }}
    >
      <Ionicons name={icon} size={20} color={danger ? '#dc2626' : '#374151'} />
      <Text
        style={{
          marginLeft: 12,
          fontSize: 14,
          color: danger ? '#dc2626' : '#111827',
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
