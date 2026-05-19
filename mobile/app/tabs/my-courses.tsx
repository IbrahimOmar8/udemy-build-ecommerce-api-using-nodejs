import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { fetchMyEnrollments } from '@/lib/queries';
import { useAuthStore } from '@/store/useAuthStore';
import type { Course, Enrollment } from '@/types';

export default function MyCoursesTab() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['enrollments', 'me'],
    queryFn: fetchMyEnrollments,
    enabled: !!user,
  });

  if (!user) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#374151', marginBottom: 12 }}>
            Log in to access your learning.
          </Text>
          <Pressable
            onPress={() => router.push('/auth/login')}
            style={{
              backgroundColor: '#243df5',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Log in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '800' }}>My learning</Text>
      </View>
      {isLoading ? (
        <Text style={{ textAlign: 'center', color: '#6b7280' }}>Loading…</Text>
      ) : (
        <FlatList
          data={data?.data || []}
          keyExtractor={(e) => e._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          renderItem={({ item }) => <EnrollmentRow enrollment={item} />}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#6b7280', marginTop: 40 }}>
              You aren&apos;t enrolled in any course yet.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

function EnrollmentRow({ enrollment }: { enrollment: Enrollment }) {
  const router = useRouter();
  const course = enrollment.course as Course;
  return (
    <Pressable
      onPress={() => router.push(`/learn/${course._id}`)}
      style={{
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 10,
        marginBottom: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
      }}
    >
      {course.thumbnail ? (
        <Image
          source={{ uri: course.thumbnail }}
          style={{ width: 100, height: 80 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 100,
            height: 80,
            backgroundColor: '#f3f4f6',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontWeight: '700', color: '#9ca3af' }}>
            {course.title?.charAt(0)}
          </Text>
        </View>
      )}
      <View style={{ flex: 1, padding: 12 }}>
        <Text numberOfLines={2} style={{ fontWeight: '600', fontSize: 14 }}>
          {course.title}
        </Text>
        <View
          style={{
            height: 6,
            backgroundColor: '#e5e7eb',
            borderRadius: 3,
            marginTop: 8,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: 6,
              backgroundColor: '#16a34a',
              width: `${enrollment.progressPercent}%`,
            }}
          />
        </View>
        <Text style={{ marginTop: 4, fontSize: 11, color: '#6b7280' }}>
          {enrollment.progressPercent}% complete
        </Text>
      </View>
    </Pressable>
  );
}
