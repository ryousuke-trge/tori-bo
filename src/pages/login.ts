import { supabase } from '../supabase';

export function renderLogin(container: HTMLElement) {
  const html = `
    <div class="h-full flex flex-col items-center justify-center p-6 bg-gray-50">
      <div class="w-full max-w-sm bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">とりーぼ</h1>
        
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input type="email" id="login-email" required class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="you@example.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input type="password" id="login-password" required class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="••••••••">
          </div>
          
          <div id="login-error" class="text-red-500 text-sm hidden text-center"></div>
          
          <button type="submit" id="btn-login" class="w-full py-3 bg-yellow-400 text-white font-bold rounded-xl shadow-md hover:bg-yellow-500 transition-colors">
            ログイン
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-500 relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-white px-2">または</span>
          </div>
        </div>

        <button type="button" id="btn-signup" class="mt-6 w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
          新規アカウント作成
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  const form = document.getElementById('login-form') as HTMLFormElement;
  const emailInput = document.getElementById('login-email') as HTMLInputElement;
  const passwordInput = document.getElementById('login-password') as HTMLInputElement;
  const errorDiv = document.getElementById('login-error') as HTMLDivElement;
  const btnLogin = document.getElementById('btn-login') as HTMLButtonElement;
  const btnSignup = document.getElementById('btn-signup') as HTMLButtonElement;

  const showError = (msg: string) => {
    errorDiv.textContent = msg;
    errorDiv.classList.remove('hidden');
  };

  const clearError = () => {
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) return;

    btnLogin.disabled = true;
    btnLogin.textContent = 'ログイン中...';

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
      // Success, main.ts will detect onAuthStateChange and handle route
    } catch (err: any) {
      console.error(err);
      showError(err.message === 'Invalid login credentials' ? 'メールアドレスまたはパスワードが間違っています' : err.message || 'ログインに失敗しました');
      btnLogin.disabled = false;
      btnLogin.textContent = 'ログイン';
    }
  });

  btnSignup.addEventListener('click', async () => {
    clearError();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('メールアドレスとパスワードを入力して「新規アカウント作成」を押してください');
      return;
    }

    btnSignup.disabled = true;
    btnSignup.textContent = '作成中...';

    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        throw error;
      }
      alert('アカウントが作成されました！そのままログインしました。');
      // Success
    } catch (err: any) {
      console.error(err);
      showError(err.message || 'アカウント作成に失敗しました');
      btnSignup.disabled = false;
      btnSignup.textContent = '新規アカウント作成';
    }
  });
}
