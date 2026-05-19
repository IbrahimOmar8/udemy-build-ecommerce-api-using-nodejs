import { FlatList, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchCourses } from '@/lib/queries';
import CourseCard from '@/components/course/CourseCard';
import { useAuthStore } from '@/store/useAuthStore';

export default function HomeTab() {
  const user = useAuthStore((s) => s.user);

  const { data: top } = useQuery({
    queryKey: ['courses', 'popular'],
    queryFn: () => fetchCourses({ limit: 8, sort: '-enrollmentsCount' }),
  });
  const { data: newest } = useQuery({
    queryKey: ['courses', 'newest'],
    queryFn: () => fetchCourses({ limit: 8, sort: '-createdAt' }),
  });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero */}
        <View style={{ backgroundColor: '#243df5', padding: 20, paddingTop: 32 }}>
          <Text style={{ color: 'white', fontSize: 14, opacity: 0.85 }}>
            {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Hello there'}
          </Text>
          <Text
            style={{
              color: 'white',
              fontSize: 26,
              fontWeight: '800',
              marginTop: 6,
              lineHeight: 32,
            }}
          >
            Learn anything,{'\n'}achieve everything.
          </Text>
        </View>

        {/* Popular */}
        <Section title="Most popular">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            data={top?.data || []}
            keyExtractor={(c) => c._id}
            renderItem={({ item }) => <CourseCard course={item} />}
          />
        </Section>

        {/* Newest */}
        <Section title="Newly added">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            data={newest?.data || []}
            keyExtractor={(c) => c._id}
            renderItem={({ item }) => <CourseCard course={item} />}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text
        style={{
          paddingHorizontal: 16,
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 10,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
