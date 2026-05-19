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

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
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
        <Text style={{ fontSize: 28, fontWeight: '800' }}>Welcome back</Text>
        <Text style={{ color: '#6b7280', marginTop: 4, marginBottom: 24 }}>
          Log in to continue learning.
        </Text>

        <Field label="Email">
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={inputStyle}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password">
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={inputStyle}
            placeholder="••••••••"
          />
        </Field>

        {error && (
          <Text style={{ color: '#dc2626', marginTop: 4, fontSize: 13 }}>
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
            <Text style={{ color: 'white', fontWeight: '600' }}>Log in</Text>
          )}
        </Pressable>

        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: '#6b7280' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" style={{ color: '#243df5', fontWeight: '600' }}>
              Sign up
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ marginBottom: 6, fontSize: 13, color: '#374151', fontWeight: '500' }}>
        {label}
      </Text>
      {children}
    </View>
  );
}
