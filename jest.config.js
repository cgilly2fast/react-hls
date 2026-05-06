export default {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['@testing-library/jest-dom'],
    moduleNameMapper: {
        '^hls.js$': '<rootDir>/test/mocks/hls.mock.ts',
    },
    testMatch: ['<rootDir>/test/**/*.spec.tsx'],
}
