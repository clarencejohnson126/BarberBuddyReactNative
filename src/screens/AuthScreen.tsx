// Enhanced Authentication Screen for BarberBuddy
// Complete sign-in/sign-up flow with proper UX and error handling

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../theme/colors';
import { createSupabaseService, AuthResult, SignUpResult } from '../services/supabaseService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const AuthScreen: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  
  // Form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const supabaseService = createSupabaseService();

  // Clear form errors when switching between sign in/up
  useEffect(() => {
    setFormErrors({});
  }, [isSignUp]);

  // Real-time validation
  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return undefined;
  };

  // Handle input changes with validation
  const handleEmailChange = (text: string) => {
    setEmail(text);
    const error = validateEmail(text);
    setFormErrors(prev => ({ ...prev, email: error }));
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    const error = validatePassword(text);
    setFormErrors(prev => ({ ...prev, password: error }));
    
    // Also validate confirm password if it exists
    if (confirmPassword) {
      const confirmError = validateConfirmPassword(confirmPassword, text);
      setFormErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    const error = validateConfirmPassword(text, password);
    setFormErrors(prev => ({ ...prev, confirmPassword: error }));
  };

  const handleAuth = async () => {
    // Final validation before submission
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = isSignUp ? validateConfirmPassword(confirmPassword, password) : undefined;

    if (emailError || passwordError || confirmPasswordError) {
      setFormErrors({
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const result: SignUpResult = await supabaseService.signUp(email, password, {
          emailRedirectTo: 'barberbuddy://auth/confirm'
        });
        
        if (!result.success) {
          showToast(result.error || 'Sign up failed', 'error');
          return;
        }

        if (result.needsConfirmation) {
          showToast('Account created! Please check your email to verify your account.', 'success');
          // Clear form and switch to sign in
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setIsSignUp(false);
        } else {
          showToast('Account created and signed in!', 'success');
          // AuthContext will handle navigation
        }

      } else {
        const result: AuthResult = await supabaseService.signIn(email, password);
        
        if (!result.success) {
          showToast(result.error || 'Sign in failed', 'error');
          return;
        }

        showToast('Welcome back!', 'success');
        // Let AuthContext onAuthStateChange drive navigation
      }

    } catch (error) {
      console.error('💥 AuthScreen.handleAuth() error:', error);
      console.error('💥 Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    setFormErrors({});
    setPassword('');
    setConfirmPassword('');
  };

  // Helper to render input with error
  const renderInput = (
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    error?: string,
    secureTextEntry = false,
    showPasswordToggle = false,
    showPassword?: boolean,
    onTogglePassword?: () => void,
    keyboardType: any = 'default',
    autoComplete: any = 'off'
  ) => (
    <View style={styles.inputWrapper}>
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        <Ionicons 
          name={placeholder === 'Email' ? 'mail-outline' : 'lock-closed-outline'} 
          size={20} 
          color={error ? '#ef4444' : COLORS.white} 
          style={styles.inputIcon} 
        />
        <TextInput
          style={[styles.input, { opacity: loading ? 0.7 : 1 }]}
          placeholder={placeholder}
          placeholderTextColor={error ? 'rgba(239, 68, 68, 0.7)' : COLORS.white + '80'}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoComplete={autoComplete}
          editable={!loading}
        />
        {showPasswordToggle && (
          <TouchableOpacity onPress={onTogglePassword} style={styles.passwordToggle}>
            <Ionicons 
              name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color={COLORS.white} 
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.purplePrimary, COLORS.pinkAccent]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>BarberBuddy</Text>
            <Text style={styles.subtitle}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </Text>
          </View>

          {/* Auth Form */}
          <View style={styles.form}>
            {renderInput(
              'Email',
              email,
              handleEmailChange,
              formErrors.email,
              false,
              false,
              false,
              undefined,
              'email-address',
              'email'
            )}

            {renderInput(
              'Password',
              password,
              handlePasswordChange,
              formErrors.password,
              true,
              true,
              showPassword,
              () => setShowPassword(!showPassword),
              'default',
              isSignUp ? 'new-password' : 'current-password'
            )}

            {isSignUp && renderInput(
              'Confirm Password',
              confirmPassword,
              handleConfirmPasswordChange,
              formErrors.confirmPassword,
              true,
              true,
              showConfirmPassword,
              () => setShowConfirmPassword(!showConfirmPassword),
              'default',
              'new-password'
            )}

            <TouchableOpacity
              style={[
                styles.authButton, 
                loading ? styles.authButtonLoading : null
              ]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.authButtonText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={handleModeSwitch}
              disabled={loading}
            >
              <Text style={[styles.switchButtonText, loading ? { opacity: 0.5 } : null]}>
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : 'Need an account? Sign Up'
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white + '90',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    minHeight: 56,
  },
  inputError: {
    borderColor: 'rgba(239, 68, 68, 0.8)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  inputIcon: {
    marginLeft: 15,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    paddingVertical: 15,
    paddingRight: 15,
  },
  passwordToggle: {
    padding: 10,
    marginRight: 5,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  authButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 56,
  },
  authButtonLoading: {
    opacity: 0.7,
  },
  authButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  switchButtonText: {
    color: COLORS.white + '90',
    fontSize: 14,
    fontWeight: '500',
  },
});