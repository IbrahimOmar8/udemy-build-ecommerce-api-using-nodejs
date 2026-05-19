import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { enrollFree, fetchCourse } from '@/lib/queries';
import { useAuthStore } from '@/store/useAuthStore';
import { extractError } from '@/lib/api';
import { useState } from 'react';

export default function CourseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [msg, setMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => fetchCourse(id!),
    enabled: !!id,
  });

  const enrollMut = useMutation({
    mutationFn: () => enrollFree(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      router.push(`/learn/${id}`);
    },
    onError: (e) => setMsg(extractError(e)),
  });

  if (isLoading || !data?.data) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const course = data.data;
  const isFree = course.isFree || course.price === 0;
  const instructorName =
    typeof course.instructor === 'object' ? course.instructor.name : 'Instructor';

  const onPrimaryAction = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (data.isEnrolled) {
      router.push(`/learn/${course._id}`);
    } else if (isFree) {
      enrollMut.mutate();
    } else {
      setMsg('Paid checkout coming soon on mobile. Use the web for now.');
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView>
        {course.thumbnail && (
          <Image
            source={{ uri: course.thumbnail }}
            style={{ width: '100%', height: 220 }}
            resizeMode="cover"
          />
        )}
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '800' }}>{course.title}</Text>
          {course.subtitle && (
            <Text style={{ color: '#6b7280', marginTop: 4 }}>{course.subtitle}</Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text style={{ marginLeft: 4, fontWeight: '600' }}>
              {course.ratingsAverage?.toFixed(1) || '—'}
            </Text>
            <Text style={{ marginLeft: 4, color: '#6b7280', fontSize: 12 }}>
              ({course.ratingsQuantity} ratings) • {course.enrollmentsCount} students
            </Text>
          </View>
          <Text style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
            By {instructorName}
          </Text>
          <Text style={{ marginTop: 16, fontSize: 24, fontWeight: '800' }}>
            {isFree ? 'Free' : `$${(course.discountPrice || course.price).toFixed(2)}`}
          </Text>

          {msg && (
            <Text style={{ marginTop: 10, color: '#b45309' }}>{msg}</Text>
          )}

          <Pressable
            onPress={onPrimaryAction}
            disabled={enrollMut.isPending}
            style={{
              backgroundColor: '#243df5',
              padding: 14,
              borderRadius: 10,
              marginTop: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>
              {data.isEnrolled
                ? 'Continue learning'
                : isFree
                  ? 'Enroll for free'
                  : 'Add to cart (web)'}
            </Text>
          </Pressable>

          <Text style={{ marginTop: 24, fontSize: 18, fontWeight: '700' }}>
            Description
          </Text>
          <Text style={{ marginTop: 8, lineHeight: 22, color: '#374151' }}>
            {course.description}
          </Text>

          <Text style={{ marginTop: 24, fontSize: 18, fontWeight: '700' }}>
            Course content
          </Text>
          {(course.sections || []).map((s) => (
            <View key={s._id} style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: '600', marginBottom: 6 }}>{s.title}</Text>
              {(s.lectures || []).map((l) => (
                <View
                  key={l._id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ flex: 1, color: '#374151' }}>{l.title}</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                    {l.isPreview ? 'Preview' : ''}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
