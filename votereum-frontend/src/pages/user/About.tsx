import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-blue-600">
                  Votereum
                </span>
              </Link>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link
                  to="/"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/about"
                  className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  aria-current="page"
                >
                  About
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center">
              <Link
                to="/admin"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Admin Dashboard
              </Link>
              <Link
                to="/login"
                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 lg:flex lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
              About Votereum
            </h2>
            <p className="mt-5 text-xl text-indigo-100">
              Revolutionizing democratic processes through blockchain
              technology.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="relative py-16 bg-white overflow-hidden">
        <div className="hidden lg:block lg:absolute lg:inset-y-0 lg:h-full lg:w-full">
          <div
            className="relative h-full text-lg max-w-prose mx-auto"
            aria-hidden="true"
          >
            <svg
              className="absolute top-12 left-full transform translate-x-32"
              width="404"
              height="384"
              fill="none"
              viewBox="0 0 404 384"
            >
              <defs>
                <pattern
                  id="74b3fd99-0a6f-4271-bef2-e80eeafdf357"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect
                    x="0"
                    y="0"
                    width="4"
                    height="4"
                    className="text-gray-200"
                    fill="currentColor"
                  />
                </pattern>
              </defs>
              <rect
                width="404"
                height="384"
                fill="url(#74b3fd99-0a6f-4271-bef2-e80eeafdf357)"
              />
            </svg>
            <svg
              className="absolute top-1/2 right-full transform -translate-y-1/2 -translate-x-32"
              width="404"
              height="384"
              fill="none"
              viewBox="0 0 404 384"
            >
              <defs>
                <pattern
                  id="f210dbf6-a58d-4871-961e-36d5016a0f49"
                  x="0"
                  y="0"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <rect
                    x="0"
                    y="0"
                    width="4"
                    height="4"
                    className="text-gray-200"
                    fill="currentColor"
                  />
                </pattern>
              </defs>
              <rect
                width="404"
                height="384"
                fill="url(#f210dbf6-a58d-4871-961e-36d5016a0f49)"
              />
            </svg>
          </div>
        </div>
        <div className="relative px-4 sm:px-6 lg:px-8">
          <div className="text-lg max-w-prose mx-auto">
            <h3 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Our Mission
            </h3>
            <p className="mt-8 text-xl text-gray-500 leading-8">
              At Votereum, we believe that voting is the cornerstone of
              democracy, and its integrity should be beyond question. Our
              mission is to create a voting platform that is accessible, secure,
              and transparent, empowering organizations and communities to make
              collective decisions with confidence.
            </p>
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="bg-gray-50 overflow-hidden">
        <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <svg
            className="absolute top-0 left-full transform -translate-x-1/2 -translate-y-3/4 lg:left-auto lg:right-full lg:translate-x-2/3 lg:translate-y-1/4"
            width="404"
            height="784"
            fill="none"
            viewBox="0 0 404 784"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="8b1b5f72-e944-4457-af67-0c6d15a99f38"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x="0"
                  y="0"
                  width="4"
                  height="4"
                  className="text-gray-200"
                  fill="currentColor"
                />
              </pattern>
            </defs>
            <rect
              width="404"
              height="784"
              fill="url(#8b1b5f72-e944-4457-af67-0c6d15a99f38)"
            />
          </svg>

          <div className="relative lg:grid lg:grid-cols-3 lg:gap-x-8">
            <div className="lg:col-span-1">
              <h3 className="text-3xl font-extrabold tracking-tight text-gray-900">
                The Technology Behind Votereum
              </h3>
            </div>
            <div className="mt-10 sm:mt-0 lg:col-span-2">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    Blockchain Foundation
                  </h4>
                  <p className="mt-2 text-base text-gray-500">
                    Votereum is built on the Ethereum blockchain, providing a
                    distributed and immutable ledger that records votes. Once a
                    vote is cast, it cannot be altered or deleted, ensuring the
                    integrity of the election process.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    Smart Contracts
                  </h4>
                  <p className="mt-2 text-base text-gray-500">
                    Our platform uses smart contracts to automate the election
                    process. These self-executing contracts enforce the rules of
                    the election, count votes, and determine results without
                    human intervention, eliminating the possibility of
                    manipulation.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    Voter Authentication
                  </h4>
                  <p className="mt-2 text-base text-gray-500">
                    Secure digital identity verification ensures that only
                    eligible voters can participate while maintaining their
                    privacy. Each voter can verify that their vote was recorded
                    correctly without revealing their specific choice.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    Transparent Results
                  </h4>
                  <p className="mt-2 text-base text-gray-500">
                    All votes are publicly verifiable on the blockchain while
                    maintaining voter privacy. Anyone can independently verify
                    the vote count and election results, ensuring complete
                    transparency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto divide-y-2 divide-gray-200">
            <h2 className="text-center text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <dl className="mt-6 space-y-6 divide-y divide-gray-200">
              <div className="pt-6">
                <dt className="text-lg">
                  <span className="font-medium text-gray-900">
                    Is blockchain voting secure?
                  </span>
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  Yes, blockchain voting is highly secure. The decentralized
                  nature of blockchain means there's no single point of failure.
                  Each vote is cryptographically secured and immutable once
                  recorded. The system is resistant to tampering and fraud.
                </dd>
              </div>

              <div className="pt-6">
                <dt className="text-lg">
                  <span className="font-medium text-gray-900">
                    How does Votereum ensure one person, one vote?
                  </span>
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  Votereum uses secure identity verification processes to ensure
                  each eligible voter can only vote once. Our system combines
                  blockchain technology with secure authentication methods that
                  prevent duplicate voting while maintaining voter privacy.
                </dd>
              </div>

              <div className="pt-6">
                <dt className="text-lg">
                  <span className="font-medium text-gray-900">
                    Can I verify my vote was counted correctly?
                  </span>
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  Absolutely. Each voter receives a unique verification code
                  that allows them to check that their vote was recorded
                  correctly on the blockchain. This verification can be done
                  without revealing who you voted for, maintaining the secrecy
                  of your ballot.
                </dd>
              </div>

              <div className="pt-6">
                <dt className="text-lg">
                  <span className="font-medium text-gray-900">
                    What type of elections can use Votereum?
                  </span>
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  Votereum is versatile and can be used for various election
                  types, from corporate board elections and shareholder voting
                  to community organizations, universities, and even national
                  elections. The platform is scalable and can be customized to
                  meet specific requirements.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to experience secure voting?</span>
            <span className="block">Start using Votereum today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-100">
            Join organizations worldwide that trust Votereum for their most
            important decisions.
          </p>
          <Link
            to="/signup"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-indigo-50 sm:w-auto"
          >
            Sign up for free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 md:order-2">
              <span className="text-gray-400 hover:text-gray-300 cursor-pointer">
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </span>
              <span className="text-gray-400 hover:text-gray-300 cursor-pointer">
                <span className="sr-only">GitHub</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
            <p className="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
              &copy; 2025 Votereum. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
