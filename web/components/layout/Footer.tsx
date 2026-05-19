import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-8 text-sm text-gray-600">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
        <div>
          <h4 className="mb-3 font-semibold text-gray-900">Learn</h4>
          <ul className="space-y-2">
            <li><Link href="/courses">Browse courses</Link></li>
            <li><Link href="/courses?level=beginner">For beginners</Link></li>
            <li><Link href="/certificates">Certificates</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-gray-900">Teach</h4>
          <ul className="space-y-2">
            <li><Link href="/register?role=instructor">Become an instructor</Link></li>
            <li><Link href="/instructor">Instructor dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-gray-900">Company</h4>
          <ul className="space-y-2">
            <li><Link href="/">About</Link></li>
            <li><Link href="/">Careers</Link></li>
            <li><Link href="/">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-gray-900">Legal</h4>
          <ul className="space-y-2">
            <li><Link href="/">Terms</Link></li>
            <li><Link href="/">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl px-4 text-xs text-gray-500">
        © {new Date().getFullYear()} LearnHub. All rights reserved.
      </div>
    </footer>
  );
}
