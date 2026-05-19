import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchCourse,
  fetchLecture,
  fetchMyProgress,
  markLectureCompleted,
} from '@/lib/queries';
import type { Lecture } from '@/types';

export default function LearnScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentLectureId, setCurrentLectureId] = useState<string | null>(null);
  const [lecture, setLecture] = useState<Lecture | null>(null);

  const { data: courseData } = useQuery({
    queryKey: ['course', id],
    queryFn: () => fetchCourse(id!),
    enabled: !!id,
  });
  const course = courseData?.data;

  const { data: progressData } = useQuery({
    queryKey: ['course', id, 'progress'],
    queryFn: () => fetchMyProgress(id!),
    enabled: !!id,
  });

  const completed = new Set(progressData?.data.completedLectures || []);

  useEffect(() => {
    if (course?.sections && !currentLectureId) {
      const first =
        progressData?.data.lastLecture ||
        course.sections.flatMap((s) => s.lectures || [])[0]?._id;
      if (first) setCurrentLectureId(first);
    }
  }, [course, currentLectureId, progressData]);

  useEffect(() => {
    if (currentLectureId) {
      fetchLecture(currentLectureId).then(setLecture).catch(() => setLecture(null));
    }
  }, [currentLectureId]);

  const markMut = useMutation({
    mutationFn: (lectureId: string) => markLectureCompleted(id!, lectureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id, 'progress'] });
    },
  });

  if (!course) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'black' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          backgroundColor: 'black',
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
        <Text
          numberOfLines={1}
          style={{ flex: 1, color: 'white', fontWeight: '700', marginLeft: 8 }}
        >
          {course.title}
        </Text>
      </View>

      {/* Player */}
      {lecture?.type === 'video' && lecture.videoUrl ? (
        <Video
          source={{ uri: lecture.videoUrl }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: 'black' }}
          onPlaybackStatusUpdate={(status) => {
            if ('didJustFinish' in status && status.didJustFinish) {
              markMut.mutate(lecture._id);
            }
          }}
        />
      ) : lecture?.type === 'article' ? (
        <ScrollView
          style={{ backgroundColor: '#111', maxHeight: 300 }}
          contentContainerStyle={{ padding: 16 }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 18 }}>
            {lecture.title}
          </Text>
          <Text style={{ color: '#d1d5db', marginTop: 8 }}>
            {lecture.article}
          </Text>
        </ScrollView>
      ) : (
        <View
          style={{
            width: '100%',
            aspectRatio: 16 / 9,
            backgroundColor: '#111',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#9ca3af' }}>Select a lecture to start</Text>
        </View>
      )}

      {/* Curriculum */}
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        {/* Progress bar */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: '#e5e7eb',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                flex: 1,
                height: 6,
                backgroundColor: '#e5e7eb',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: 6,
                  backgroundColor: '#16a34a',
                  width: `${progressData?.data.progressPercent || 0}%`,
                }}
              />
            </View>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>
              {progressData?.data.progressPercent || 0}%
            </Text>
          </View>

          {lecture && (
            <Pressable
              onPress={() => markMut.mutate(lecture._id)}
              disabled={completed.has(lecture._id)}
              style={{
                marginTop: 10,
                backgroundColor: completed.has(lecture._id) ? '#d1d5db' : '#243df5',
                padding: 10,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>
                {completed.has(lecture._id) ? 'Completed' : 'Mark as completed'}
              </Text>
            </Pressable>
          )}
        </View>

        <ScrollView>
          {(course.sections || []).map((s) => (
            <View key={s._id}>
              <Text
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: '#f9fafb',
                  fontWeight: '700',
                }}
              >
                {s.title}
              </Text>
              {(s.lectures || []).map((l) => {
                const isActive = l._id === currentLectureId;
                const isDone = completed.has(l._id);
                return (
                  <Pressable
                    key={l._id}
                    onPress={() => setCurrentLectureId(l._id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: isActive ? '#eef4ff' : 'white',
                      borderBottomWidth: 1,
                      borderColor: '#f3f4f6',
                    }}
                  >
                    <Ionicons
                      name={isDone ? 'checkmark-circle' : 'play-circle-outline'}
                      size={20}
                      color={isDone ? '#16a34a' : '#9ca3af'}
                    />
                    <Text style={{ flex: 1, marginLeft: 10 }}>{l.title}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
