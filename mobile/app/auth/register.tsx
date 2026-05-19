import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { extractError } from '@/lib/api';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password, role);
      router.replace('/tabs');
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '800' }}>Create account</Text>
        <Text style={{ color: '#6b7280', marginTop: 4, marginBottom: 24 }}>
          Join thousands learning and teaching online.
        </Text>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#f3f4f6',
            borderRadius: 10,
            padding: 4,
            marginBottom: 18,
          }}
        >
          {(['student', 'instructor'] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r)}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: role === r ? 'white' : 'transparent',
              }}
            >
              <Text style={{ fontWeight: '600', color: role === r ? '#243df5' : '#6b7280' }}>
                {r === 'student' ? 'I want to learn' : 'I want to teach'}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          placeholder="Full name"
          value={name}
          onChangeText={setName}
          style={inputStyle}
        />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[inputStyle, { marginTop: 12 }]}
        />
        <TextInput
          placeholder="Password (min 6)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[inputStyle, { marginTop: 12 }]}
        />

        {error && (
          <Text style={{ color: '#dc2626', marginTop: 8, fontSize: 13 }}>
            {error}
          </Text>
        )}

        <Pressable
          onPress={submit}
          disabled={loading}
          style={{
            backgroundColor: '#243df5',
            padding: 14,
            borderRadius: 10,
            marginTop: 20,
            alignItems: 'center',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: 'white', fontWeight: '600' }}>Create account</Text>
          )}
        </Pressable>

        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: '#6b7280' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#243df5', fontWeight: '600' }}>
              Log in
            </Link>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: '#d1d5db',
  borderRadius: 8,
  padding: 12,
  fontSize: 14,
  backgroundColor: 'white',
};
