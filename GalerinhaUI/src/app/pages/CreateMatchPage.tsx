import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';

export const CreateMatchPage: React.FC = () => {
  const { createMatch } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    format: '5x5', // Default format
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Obter data mínima (hoje)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Obter data máxima (1 ano no futuro)
  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today.setFullYear(today.getFullYear() + 1));
    return maxDate.toISOString().split('T')[0];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validar nome
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }
    
    // Validar data
    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'Não é possível criar pelada com data passada';
      }
    }
    
    // Validar hora
    if (!formData.time) {
      newErrors.time = 'Hora é obrigatória';
    } else {
      const [hours] = formData.time.split(':').map(Number);
      if (hours < 6 || hours > 23) {
        newErrors.time = 'Horário deve estar entre 06:00 e 23:59';
      }
      
      // Se for hoje, validar que a hora não passou
      if (formData.date === getMinDate()) {
        const now = new Date();
        const [selectedHours, selectedMinutes] = formData.time.split(':').map(Number);
        const selectedTime = selectedHours * 60 + selectedMinutes;
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        if (selectedTime <= currentTime) {
          newErrors.time = 'Horário já passou. Escolha um horário futuro';
        }
      }
    }
    
    // Validar local
    if (!formData.location || formData.location.trim().length < 3) {
      newErrors.location = 'Local deve ter pelo menos 3 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const matchId = await createMatch(formData);
      navigate(`/match/${matchId}`);
    } catch (error) {
      console.error('Erro ao criar pelada:', error);
      alert('Erro ao criar pelada. Tente novamente.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    
    // Limpar erro do campo ao editar
    if (errors[id]) {
      setErrors({ ...errors, [id]: '' });
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/home">
          <Button variant="ghost" size="sm" className="-ml-2">
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Criar Nova Pelada</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              id="name"
              label="Nome da Pelada"
              placeholder="Ex: Futebol de Quinta"
              value={formData.name}
              onChange={handleChange}
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                id="date"
                type="date"
                label="Data"
                value={formData.date}
                onChange={handleChange}
                min={getMinDate()}
                max={getMaxDate()}
                required
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.date}
                </p>
              )}
            </div>
            <div>
              <Input
                id="time"
                type="time"
                label="Hora"
                value={formData.time}
                onChange={handleChange}
                required
              />
              {errors.time && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.time}
                </p>
              )}
            </div>
          </div>

          <div>
            <Input
              id="location"
              label="Local"
              placeholder="Ex: Arena Society"
              value={formData.location}
              onChange={handleChange}
              required
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.location}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Formato
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['5x5', '4x4'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormData({ ...formData, format: fmt })}
                  className={`relative py-3 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    formData.format === fmt
                      ? 'border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37]'
                      : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200'
                  }`}
                >
                  <span className="text-lg">{fmt === '5x5' ? '5 x 5' : '4 x 4'}</span>
                  <p className="text-[10px] mt-0.5 opacity-70">
                    {fmt === '5x5' ? '10 jogadores' : '8 jogadores'}
                  </p>
                  {formData.format === fmt && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#d4af37]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full">
              Criar Pelada
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
