import{ useState } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { untrusted, escapeText, validateEmail } from '../../utils/security'
import { useTheme } from '../../hooks/useTheme'

export default function SanitizedInput({
    type = 'text',
    value = '',
    onChange,
    onBlur,
    placeholder,
    label,
    required = false,
    minLength,
    maxLength,
    pattern,
    validate = 'none',
    error: externalError,
    className = '',
    ...props
    }) {
    const [internalError, setInternalError] = useState('')
    const [touched, setTouched] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const { theme } = useTheme()
    
    const error = externalError || (touched ? internalError : '')
    const isValid = touched && !error && value.length > 0
    
    const inputType = type === 'password' && showPassword ? 'text' : type

    const handleChange = (e) => {
        const rawValue = e.target.value
        const untrustedValue = untrusted(rawValue)
        
        let errorMsg = ''
        
        switch (validate) {
        case 'email':
            try {
            validateEmail(untrustedValue)
            } catch (err) {
            errorMsg = err.message
            }
            break
        case 'text':
            escapeText(untrustedValue)
            break
        }
        
        if (minLength && rawValue.length < minLength && rawValue.length > 0) {
        errorMsg = `Minimum ${minLength} caractères`
        }
        
        if (maxLength && rawValue.length > maxLength) {
        errorMsg = `Maximum ${maxLength} caractères`
        }
        
        setInternalError(errorMsg)
        onChange?.(e)
    }

    // Theme-aware colors for animated label
    const focusedLabelColor = theme === 'dark' ? '#818cf8' : '#4f46e5'
    const defaultLabelColor = theme === 'dark' ? '#9ca3af' : '#334155'

    return (
        <div className="space-y-2">
        {label && (
            <motion.label 
            className="block text-sm font-medium text-secondary-700 dark:text-gray-300"
            animate={{ 
                color: isFocused ? focusedLabelColor : defaultLabelColor,
                x: isFocused ? 4 : 0
            }}
            >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
            </motion.label>
        )}
        
        <div className="relative">
            <input
            type={inputType}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
                setIsFocused(false)
                setTouched(true)
                onBlur?.(e)
            }}
            placeholder={placeholder}
            required={required}
            minLength={minLength}
            maxLength={maxLength}
            pattern={pattern}
            className={`
                w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm
                border-2 rounded-xl outline-none transition-all
                dark:text-white dark:placeholder:text-gray-500
                ${error 
                ? 'border-red-300 dark:border-red-500/50 focus:border-red-500 dark:focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30' 
                : isValid
                    ? 'border-emerald-300 dark:border-emerald-500/50 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30'
                    : 'border-secondary-200 dark:border-gray-600 focus:border-primary-400 dark:focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30'
                }
                ${className}
            `}
            {...props}
            />
            
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
            {type === 'password' && (
                <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 hover:bg-secondary-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                {showPassword ? 
                    <EyeOff className="w-5 h-5 text-secondary-400 dark:text-gray-400" /> : 
                    <Eye className="w-5 h-5 text-secondary-400 dark:text-gray-400" />
                }
                </button>
            )}
            
            <AnimatePresence>
                {isValid && !error && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                >
                    <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                </motion.div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {error && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                >
                    <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                </motion.div>
                )}
            </AnimatePresence>
            </div>
        </div>
        
        <AnimatePresence>
            {error && (
            <motion.p
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 overflow-hidden"
            >
                <AlertCircle className="w-4 h-4" />
                {error}
            </motion.p>
            )}
        </AnimatePresence>
        </div>
    )
}