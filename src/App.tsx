
const App = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">ReciclaE App</h1>
      <p className="text-xl text-gray-600 mb-4">Sistema funcionando</p>
      <div className="space-y-2">
        <a href="/login" className="block text-blue-500 hover:text-blue-700 underline">
          Login
        </a>
        <a href="/validate-password" className="block text-blue-500 hover:text-blue-700 underline">
          Validar Senha
        </a>
      </div>
    </div>
  </div>
);

export default App;
