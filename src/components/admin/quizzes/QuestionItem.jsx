import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Copy, Trash2, Plus, X,
    AlertCircle, CheckCircle
} from 'lucide-react';
import { untrusted, escapeText } from '../../../utils/security';
import SanitizedInput from '../../ui/SanitizedInput';

const QUESTION_TYPES = (t) => [
    { value: 'single', label: t('quizzes.question.types.single') },
    { value: 'multiple', label: t('quizzes.question.types.multiple') },
    { value: 'truefalse', label: t('quizzes.question.types.truefalse') }
];

export default function QuestionItem({ question, index, onChange, onRemove, onDuplicate }) {
    const { t } = useTranslation('admin');
    const [showAnswerHelp, setShowAnswerHelp] = useState(false);
    const types = QUESTION_TYPES(t);

    const handleTypeChange = (type) => {
        let newQuestion = { ...question, type };
        if (type === 'single' || type === 'multiple') {
            newQuestion.options = question.options && question.options.length >= 2 ? question.options : ['', ''];
            newQuestion.answer = type === 'single' ? null : [];
        } else if (type === 'truefalse') {
            newQuestion.options = undefined;
            newQuestion.answer = null;
        }
        onChange(newQuestion);
    };

    const handleTextChange = (text) => {
        onChange({ ...question, text });
    };

    const handleOptionChange = (idx, value) => {
        const newOptions = [...question.options];
        newOptions[idx] = value;
        onChange({ ...question, options: newOptions });
    };

    const addOption = () => {
        onChange({ ...question, options: [...question.options, ''] });
    };

    const removeOption = (idx) => {
        if (question.options.length <= 2) return;
        const newOptions = question.options.filter((_, i) => i !== idx);
        let newAnswer = question.answer;
        if (question.type === 'single' && newAnswer === idx) {
            newAnswer = null;
        } else if (question.type === 'multiple' && Array.isArray(newAnswer)) {
            newAnswer = newAnswer.filter(a => a !== idx).map(a => a > idx ? a-1 : a);
        }
        onChange({ ...question, options: newOptions, answer: newAnswer });
    };

    const handleAnswerChange = (value) => {
        onChange({ ...question, answer: value });
    };

    const handleMultipleAnswerChange = (idx) => {
        let newAnswer = question.answer ? [...question.answer] : [];
        if (newAnswer.includes(idx)) {
            newAnswer = newAnswer.filter(i => i !== idx);
        } else {
            newAnswer.push(idx);
        }
        onChange({ ...question, answer: newAnswer });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-md border border-gray-200 dark:border-gray-700 relative group"
        >
            {/* En-tête avec numéro et actions */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                    {t('quizzes.question.title', { index: index + 1 })}
                </span>
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={onDuplicate}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={t('common.duplicate')}
                    >
                        <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                        title={t('videos.actions.delete')}
                    >
                        <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                    </button>
                </div>
            </div>

            {/* Type de question */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('quizzes.question.type_label')}</label>
                <select
                    value={question.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none dark:bg-gray-900 dark:text-white"
                >
                    {types.map(t_opt => (
                        <option key={t_opt.value} value={t_opt.value}>{t_opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Texte de la question */}
            <div className="mb-4">
                <SanitizedInput
                    label={t('quizzes.question.text_label')}
                    value={question.text}
                    onChange={(e) => handleTextChange(e.target.value)}
                    validate="text"
                    required
                    placeholder={t('quizzes.question.text_placeholder')}
                    className='dark:bg-gray-800/50 dark:border-gray-500 dark:text-white'
                />
            </div>

            {/* Options pour QCM */}
            {(question.type === 'single' || question.type === 'multiple') && (
                <div className="space-y-3 mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('quizzes.question.options_label')}</label>
                    {question.options?.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                            <input
                                type={question.type === 'single' ? 'radio' : 'checkbox'}
                                name={`answer-${index}`}
                                checked={question.type === 'single'
                                    ? question.answer === optIdx
                                    : (question.answer || []).includes(optIdx)
                                }
                                onChange={() => question.type === 'single'
                                    ? handleAnswerChange(optIdx)
                                    : handleMultipleAnswerChange(optIdx)
                                }
                                className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                            />
                            <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                                placeholder={t('quizzes.question.option_placeholder', { index: optIdx + 1 })}
                                className="flex-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none dark:bg-gray-900 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => removeOption(optIdx)}
                                disabled={question.options.length <= 2}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                            >
                                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" /> {t('quizzes.question.btn_add_option')}
                    </button>
                </div>
            )}

            {/* Vrai/Faux */}
            {question.type === 'truefalse' && (
                <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name={`truefalse-${index}`}
                            value="true"
                            checked={question.answer === true}
                            onChange={() => handleAnswerChange(true)}
                            className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{t('quizzes.question.true_label')}</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name={`truefalse-${index}`}
                            value="false"
                            checked={question.answer === false}
                            onChange={() => handleAnswerChange(false)}
                            className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{t('quizzes.question.false_label')}</span>
                    </label>
                </div>
            )}

            {/* Aide pour la réponse */}
            <div className="mt-2">
                <button
                    type="button"
                    onClick={() => setShowAnswerHelp(!showAnswerHelp)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                >
                    <AlertCircle className="w-3 h-3" />
                    {showAnswerHelp ? t('quizzes.question.help.btn_hide') : t('quizzes.question.help.btn_show')}
                </button>
                {showAnswerHelp && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {question.type === 'single' && t('quizzes.question.help.single')}
                        {question.type === 'multiple' && t('quizzes.question.help.multiple')}
                        {question.type === 'truefalse' && t('quizzes.question.help.truefalse')}
                    </p>
                )}
            </div>
        </motion.div>
    );
}