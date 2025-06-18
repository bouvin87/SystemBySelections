import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [showTenantSelection, setShowTenantSelection] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (showTenantSelection && selectedTenantId) {
        // Login with selected tenant
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            password, 
            tenantId: parseInt(selectedTenantId) 
          }),
        });

        const data = await response.json();
        
        if (response.ok && data.token) {
          localStorage.setItem('authToken', data.token);
          window.location.href = '/dashboard';
        } else {
          setError(data.message || 'Login failed');
        }
      } else {
        // Initial login attempt
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        
        if (data.requireTenantSelection && data.tenants) {
          setAvailableTenants(data.tenants);
          setShowTenantSelection(true);
          setError('');
        } else if (response.ok && data.token) {
          localStorage.setItem('authToken', data.token);
          window.location.href = '/dashboard';
        } else {
          setError(data.message || 'Login failed');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {showTenantSelection ? 'Välj organisation' : 'Logga in'}
          </CardTitle>
          <CardDescription>
            {showTenantSelection 
              ? 'Välj vilken organisation du vill logga in på'
              : 'Logga in för att komma åt dina moduler'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {!showTenantSelection && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@email.se"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Lösenord</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            {showTenantSelection && (
              <>
                <div className="space-y-2">
                  <Label>E-post: {email}</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tenant">Välj organisation</Label>
                  <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id.toString()}>
                          {tenant.name} ({tenant.userRole})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || (showTenantSelection && !selectedTenantId)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {showTenantSelection ? 'Loggar in...' : 'Kontrollerar...'}
                </>
              ) : (
                showTenantSelection ? 'Logga in på organisation' : 'Logga in'
              )}
            </Button>
            
            {showTenantSelection && (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setShowTenantSelection(false);
                  setAvailableTenants([]);
                  setSelectedTenantId('');
                  setError('');
                }}
                disabled={isLoading}
              >
                Tillbaka
              </Button>
            )}
          </form>
          

        </CardContent>
      </Card>
    </div>
  );
}