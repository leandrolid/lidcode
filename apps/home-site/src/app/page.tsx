export default function Home() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 bg-cover bg-center bg-no-repeat">
      {/* Header */}
      <div className="w-full max-w-3xl p-6 mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-sidebar-primary">lidco.de</h1>
          <a
            href="https://github.com/leandrolid"
            className="text-gray-400 hover:text-foreground transition-colors text-sm"
            title="GitHub Profile"
            aria-label="GitHub Profile"
          >
            <svg
              className="w-4 h-4 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6 w-full max-w-3xl p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Services Hub</h2>
          <h3 className="text-gray-400">
            A collection of useful services and tools for developers, built with modern technologies
            and clean APIs.
          </h3>
        </div>

        {/* ShortLid Service */}
        <div className="card-bg rounded-lg p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto bg-sidebar-primary">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">ShortLid</h3>
            <p className="text-gray-400 mb-4">
              Fast and reliable URL shortener service. Create short, memorable links for your
              projects and campaigns.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm mb-6">
            <div className="flex items-center text-gray-400">
              <svg
                className="w-4 h-4 mr-2 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              Temporary short codes
            </div>
            <div className="flex items-center text-gray-400">
              <svg
                className="w-4 h-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13.77 3.043a34 34 0 0 0-3.54 0" />
                <path d="M13.771 20.956a33 33 0 0 1-3.541.001" />
                <path d="M20.18 17.74c-.51 1.15-1.29 1.93-2.439 2.44" />
                <path d="M20.18 6.259c-.51-1.148-1.291-1.929-2.44-2.438" />
                <path d="M20.957 10.23a33 33 0 0 1 0 3.54" />
                <path d="M3.043 10.23a34 34 0 0 0 .001 3.541" />
                <path d="M6.26 20.179c-1.15-.508-1.93-1.29-2.44-2.438" />
                <path d="M6.26 3.82c-1.149.51-1.93 1.291-2.44 2.44" />
              </svg>
              Analytics & tracking (soon)
            </div>
            <div className="flex items-center text-gray-400">
              <svg
                className="w-4 h-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13.77 3.043a34 34 0 0 0-3.54 0" />
                <path d="M13.771 20.956a33 33 0 0 1-3.541.001" />
                <path d="M20.18 17.74c-.51 1.15-1.29 1.93-2.439 2.44" />
                <path d="M20.18 6.259c-.51-1.148-1.291-1.929-2.44-2.438" />
                <path d="M20.957 10.23a33 33 0 0 1 0 3.54" />
                <path d="M3.043 10.23a34 34 0 0 0 .001 3.541" />
                <path d="M6.26 20.179c-1.15-.508-1.93-1.29-2.44-2.438" />
                <path d="M6.26 3.82c-1.149.51-1.93 1.291-2.44 2.44" />
              </svg>
              REST API available (soon)
            </div>
          </div>

          <div className="text-center">
            <a
              href="https://shortlid.lidco.de"
              className="inline-block px-6 py-2 bg-sidebar-primary rounded-md hover:bg-primary font-medium transition-colors"
            >
              Try ShortLid →
            </a>
          </div>
        </div>

        {/* Coming Soon Services */}
        <div className="card-bg rounded-lg p-8">
          <h3 className="text-lg font-semibold mb-4 text-center">Coming Soon</h3>
          <div className="flex justify-center gap-6">
            <div className="text-center max-w-40">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center mb-3 mx-auto">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <h4 className="font-medium mb-2">FileLid</h4>
              <p className="text-sm text-gray-400">
                Temporary file sharing service with automatic cleanup.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 pt-4">
          <p>
            Built with ❤️ by{' '}
            <a
              href="https://github.com/leandrolid"
              className="text-sidebar-primary hover:underline"
            >
              leandrolid
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
