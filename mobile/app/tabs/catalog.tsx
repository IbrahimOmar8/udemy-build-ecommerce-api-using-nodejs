import { useState } from 'react';
import { FlatList, TextInput, View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchCourses } from '@/lib/queries';
import CourseCard from '@/components/course/CourseCard';

export default function CatalogTab() {
  const [keyword, setKeyword] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['courses', 'catalog', submitted],
    queryFn: () => fetchCourses({ keyword: submitted || undefined, limit: 20 }),
  });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: 10,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: '#e5e7eb',
          }}
        >
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            placeholder="Search courses, topics…"
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={() => setSubmitted(keyword.trim())}
            returnKeyType="search"
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8 }}
          />
        </View>
      </View>

      {isLoading ? (
        <Text style={{ textAlign: 'center', color: '#6b7280' }}>Loading…</Text>
      ) : (
        <FlatList
          data={data?.data || []}
          keyExtractor={(c) => c._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          renderItem={({ item }) => <CourseCard course={item} fullWidth />}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#6b7280', marginTop: 40 }}>
              No courses found.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
