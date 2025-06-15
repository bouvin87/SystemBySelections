import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, Shield, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inloggningen misslyckades');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    {
      name: 'Demo Admin',
      email: 'admin@demo.se',
      password: 'admin123',
      role: 'admin',
      tenant: 'Demo Company',
      icon: Building2
    },
    {
      name: 'Volvo Admin', 
      email: 'admin@volvo.se',
      password: 'admin123',
      role: 'admin',
      tenant: 'Volvo',
      icon: Building2
    },
    {
      name: 'Super Admin',
      email: 'superuser@replit.com',
      password: 'password',
      role: 'superadmin',
      tenant: 'Alla tenants',
      icon: Shield
    }
  ];

  const handleDemoLogin = (demo: typeof demoAccounts[0]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setSelectedDemo(demo.email);
  };

  // Extract tenant info from subdomain
  const subdomain = window.location.hostname.split('.')[0];
  const tenantName = subdomain === 'localhost' ? 'Demo' : subdomain;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/3 to-accent/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding and info */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ProductionLog</h1>
                <p className="text-gray-600">Modern tillverkning, smart rapportering</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Multi-tenant arkitektur</h3>
                <p className="text-gray-600">Säker och skalbar lösning för flera organisationer</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Rollbaserad åtkomst</h3>
                <p className="text-gray-600">Kontrollerad åtkomst baserat på användarroller</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Realtidsrapporter</h3>
                <p className="text-gray-600">Live-data och avancerad analys för bättre beslut</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="space-y-6">
          <Card className="modern-card glass-card">
            <CardHeader className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Välkommen tillbaka</CardTitle>
                <CardDescription className="text-gray-600">
                  Logga in på {tenantName} för att komma åt dina moduler
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">E-post</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@email.se"
                    required
                    disabled={isLoading}
                    className={`transition-all duration-300 ${selectedDemo === email ? 'ring-2 ring-primary/50' : ''}`}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700">Lösenord</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full modern-button gradient-bg text-white font-medium"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loggar in...
                    </>
                  ) : (
                    'Logga in'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo accounts */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Demo-konton</CardTitle>
              <CardDescription>Klicka för att fylla i inloggningsuppgifter automatiskt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {demoAccounts.map((demo) => {
                const Icon = demo.icon;
                return (
                  <button
                    key={demo.email}
                    onClick={() => handleDemoLogin(demo)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left modern-button ${
                      selectedDemo === demo.email 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        demo.role === 'superadmin' 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                          : 'bg-gradient-to-br from-primary to-accent'
                      }`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{demo.name}</span>
                          {demo.role === 'superadmin' && (
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{demo.email}</p>
                        <p className="text-xs text-gray-500">{demo.tenant}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}