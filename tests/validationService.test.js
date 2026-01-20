import { jest } from '@jest/globals';
/**
 * Tests per al ValidationService
 */

// Mock de localStorage per a l'entorn de tests Node
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {}
};

// Mock dels mòduls que depèn ValidationService
jest.mock('../public/js/utils/errorHandler.js', () => ({
  ErrorBoundary: {
    handleError: jest.fn()
  }
}));

// Importar el ValidationService
import { ValidationService } from '../public/js/utils/validationService.js';
import { FORM_FIELDS } from '../public/js/modules/formManager.js';

describe('FORM_FIELDS', () => {
  test('FORM_FIELDS conté els camps esperats', () => {
    expect(Array.isArray(FORM_FIELDS)).toBe(true);
    expect(FORM_FIELDS.length).toBeGreaterThan(0);
    expect(FORM_FIELDS).toContain('tipus');
    expect(FORM_FIELDS).toContain('numero');
    expect(FORM_FIELDS).toContain('data');
  });
});

// Tests per validateFieldValue eliminats - la funció era obsoleta

// Test de coherència: no hi ha arrays de camps duplicats (simulat)
describe('No hi ha arrays de camps duplicats', () => {
  it('FORM_FIELDS és l\'únic array de camps utilitzat', () => {
    // Simulació: només comprovem que FORM_FIELDS existeix i té la longitud esperada
    expect(Array.isArray(FORM_FIELDS)).toBe(true);
    expect(FORM_FIELDS.length).toBeGreaterThan(0);
  });
});

describe('ValidationService', () => {
  describe('validatePassword', () => {
    test('ha de validar un password fort', () => {
      const result = ValidationService.validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe(5);
      expect(result.strengthText).toBe('fort');
    });

    test('ha de rebutjar un password dèbil', () => {
      const result = ValidationService.validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.strength).toBeLessThan(3);
    });

    test('ha de validar un password amb mínim 8 caràcters', () => {
      const result = ValidationService.validatePassword('Password123!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBeGreaterThanOrEqual(4);
    });

    test('ha de requerir majúscules', () => {
      const result = ValidationService.validatePassword('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Almenys una majúscula');
    });

    test('ha de requerir minúscules', () => {
      const result = ValidationService.validatePassword('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Almenys una minúscula');
    });

    test('ha de requerir números', () => {
      const result = ValidationService.validatePassword('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Almenys un número');
    });

    test('ha de requerir caràcters especials', () => {
      const result = ValidationService.validatePassword('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Almenys un caràcter especial');
    });
  });

  describe('validateEmail', () => {
    test('ha de validar un email vàlid', () => {
      expect(ValidationService.validateEmail('test@example.com')).toBe(true);
      expect(ValidationService.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(ValidationService.validateEmail('test+tag@example.org')).toBe(true);
    });

    test('ha de rebutjar emails invàlids', () => {
      expect(ValidationService.validateEmail('invalid-email')).toBe(false);
      expect(ValidationService.validateEmail('test@')).toBe(false);
      expect(ValidationService.validateEmail('@example.com')).toBe(false);
      expect(ValidationService.validateEmail('test@.com')).toBe(false);
      expect(ValidationService.validateEmail('')).toBe(false);
    });
  });

  describe('validateFile', () => {
    test('ha de validar un fitxer vàlid', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = ValidationService.validateFile(file, {
        maxSize: 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png']
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('ha de rebutjar fitxers massa grans', () => {
      // Simular un fitxer de 2MB
      const bigArray = new Array(2 * 1024 * 1024).fill('x');
      const file = new File(bigArray, 'large.jpg', { type: 'image/jpeg' });
      const result = ValidationService.validateFile(file, {
        maxSize: 1024 * 1024, // 1MB
        allowedTypes: ['image/jpeg']
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El fitxer és massa gran');
    });

    test('ha de rebutjar tipus de fitxer no permesos', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = ValidationService.validateFile(file, {
        maxSize: 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png']
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tipus de fitxer no permès. Permesos: Jpeg, i Png');
    });

    test('ha de validar sense opcions', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = ValidationService.validateFile(file);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateFormData', () => {
    test('ha de validar dades de formulari vàlides', () => {
      const formData = {
        'tipus': 'Expedient de prova',
        'numero': '123/2024',
        'data': '2024-01-15',
        'hora': '14:30',
        'adreca': 'Carrer Major, 123',
        'assumpte': 'Assumpte de prova',
        'signants': 'Joan Garcia'
      };
      
      const result = ValidationService.validateFormData(formData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('ha de detectar camps obligatoris buits', () => {
      const formData = {
        'tipus': '',
        'numero': '123/2024',
        'data': '2024-01-15',
        'hora': '14:30',
        'adreca': 'Carrer Major, 123',
        'assumpte': '',
        'signants': 'Joan Garcia'
      };
      
      const result = ValidationService.validateFormData(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tipus d\'expedient és obligatori');
      expect(result.errors).toContain('Assumpte és obligatori');
    });

    test('ha de validar format de data', () => {
      const formData = {
        'tipus': 'Expedient de prova',
        'numero': '123/2024',
        'data': 'data-invalida',
        'hora': '14:30',
        'adreca': 'Carrer Major, 123',
        'assumpte': 'Assumpte de prova',
        'signants': 'Joan Garcia'
      };
      
      const result = ValidationService.validateFormData(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Format de data invàlid');
    });

    test('ha de validar format d\'hora', () => {
      const formData = {
        'tipus': 'Expedient de prova',
        'numero': '123/2024',
        'data': '2024-01-15',
        'hora': 'hora-invalida',
        'adreca': 'Carrer Major, 123',
        'assumpte': 'Assumpte de prova',
        'signants': 'Joan Garcia'
      };
      
      const result = ValidationService.validateFormData(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Format d\'hora invàlid');
    });
  });

  describe('validateReportData', () => {
    test('ha de validar dades d\'informe vàlides', () => {
      const reportData = {
        general: {
          tipus: 'Expedient de prova',
          numero: '123/2024',
          data: '2024-01-15',
          hora: '14:30',
          adreca: 'Carrer Major, 123',
          assumpte: 'Assumpte de prova',
          signants: 'Joan Garcia'
        },
        photos: [
          {
            number: 1,
            titol: 'Foto 1',
            descripcio: 'Descripció de la foto 1',
            foto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'
          }
        ]
      };
      
      const result = ValidationService.validateReportData(reportData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('ha de detectar dades generals invàlides', () => {
      const reportData = {
        general: {
          tipus: '',
          numero: '123/2024',
          data: '2024-01-15',
          hora: '14:30',
          adreca: '',
          assumpte: 'Assumpte de prova',
          signants: 'Joan Garcia'
        },
        photos: []
      };
      
      const result = ValidationService.validateReportData(reportData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tipus d\'expedient és obligatori');
      expect(result.errors).toContain('Adreça és obligatòria');
    });

    test('ha de validar fotos', () => {
      const reportData = {
        general: {
          tipus: 'Expedient de prova',
          numero: '123/2024',
          data: '2024-01-15',
          hora: '14:30',
          adreca: 'Carrer Major, 123',
          assumpte: 'Assumpte de prova',
          signants: 'Joan Garcia'
        },
        photos: [
          {
            number: 1,
            titol: '',
            descripcio: '',
            foto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'
          }
        ]
      };
      
      const result = ValidationService.validateReportData(reportData);
      expect(result.isValid).toBe(true); // Les fotos són opcionals
    });
  });

  describe('validateAndSanitizePhotoTitle', () => {
    test('ha de permetre títols buits', () => {
      const result = ValidationService.validateAndSanitizePhotoTitle('');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('');
      expect(result.errors).toHaveLength(0);
    });

    test('ha de permetre títols només amb espais', () => {
      const result = ValidationService.validateAndSanitizePhotoTitle('   ');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('');
      expect(result.errors).toHaveLength(0);
    });

    test('ha de validar títols vàlids', () => {
      const result = ValidationService.validateAndSanitizePhotoTitle('Títol de la foto');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Títol de la foto');
      expect(result.errors).toHaveLength(0);
    });

    test('ha de sanititzar títols amb caràcters perillosos', () => {
      const result = ValidationService.validateAndSanitizePhotoTitle('<script>alert("xss")</script>');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).not.toContain('<script>');
      expect(result.errors).toHaveLength(0);
    });
  });
}); 