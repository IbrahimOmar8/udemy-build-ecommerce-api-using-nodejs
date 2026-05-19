import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Course } from '@/types';

interface Props {
  course: Course;
  fullWidth?: boolean;
}

export default function CourseCard({ course, fullWidth }: Props) {
  const router = useRouter();
  const instructorName =
    typeof course.instructor === 'object' ? course.instructor.name : 'Instructor';
  const price =
    course.discountPrice && course.discountPrice > 0
      ? course.discountPrice
      : course.price;

  return (
    <Pressable
      onPress={() => router.push(`/courses/${course._id}`)}
      style={{
        width: fullWidth ? '100%' : 240,
        backgroundColor: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        marginRight: fullWidth ? 0 : 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {course.thumbnail ? (
        <Image
          source={{ uri: course.thumbnail }}
          style={{ width: '100%', height: 140 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: '100%',
            height: 140,
            backgroundColor: '#f3f4f6',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#9ca3af' }}>
            {course.title.charAt(0)}
          </Text>
        </View>
      )}
      <View style={{ padding: 12 }}>
        <Text numberOfLines={2} style={{ fontWeight: '600', fontSize: 14 }}>
          {course.title}
        </Text>
        <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
          {instructorName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={{ fontSize: 12, marginLeft: 4, fontWeight: '600' }}>
            {course.ratingsAverage?.toFixed(1) || '—'}
          </Text>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>
            ({course.ratingsQuantity})
          </Text>
        </View>
        <Text style={{ marginTop: 6, fontWeight: '700', fontSize: 16 }}>
          {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
        </Text>
      </View>
    </Pressable>
  );
}
