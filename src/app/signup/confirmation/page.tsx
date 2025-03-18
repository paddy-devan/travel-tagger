import Link from 'next/link';

export default function SignUpConfirmation() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md text-center">
        <h1 className="text-3xl font-bold">Check Your Email</h1>
        <div className="py-6">
          <svg
            className="mx-auto h-16 w-16 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-gray-600 mb-6">
          We&apos;ve sent a confirmation link to your email address. Please check your inbox and click the link to complete your registration.
        </p>
        <div className="mt-6">
          <Link
            href="/signin"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
} 