export async function register() {
  // 只在服務器端執行初始化
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeApp } = await import('@/lib/init')
    await initializeApp()
  }
}
