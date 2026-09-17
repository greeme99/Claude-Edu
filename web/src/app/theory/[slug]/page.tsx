import type { Metadata } from 'next';
import LessonPage from '@/components/LessonPage';
import { getLessons, getLesson } from '@/lib/content';

export function generateStaticParams() {
  return getLessons().filter(l => l.track === 'theory').map(l => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = getLesson('theory', slug);
  return l ? { title: l.title, description: ` ${l.seq}차시 · ${l.title}` } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LessonPage track="theory" slug={slug} />;
}
