import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'العربية', flag: '🇲🇦' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-all shadow-sm hover:shadow-md">
        <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 transition-colors" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {currentLanguage.flag}
        </span>
        <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-transform duration-200 group-data-[open]:rotate-180" />
      </MenuButton>

      <Transition
        as={AnimatePresence}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/5 focus:outline-none z-50 border border-gray-100 dark:border-gray-700 p-1">
          <div className="px-1 py-1">
            {languages.map((lang) => (
              <MenuItem key={lang.code}>
                {({ active }) => (
                  <button
                    onClick={() => changeLanguage(lang.code)}
                    className={`${
                      active ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                    } group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                    {i18n.language === lang.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Check className="w-4 h-4 text-indigo-500" />
                      </motion.div>
                    )}
                  </button>
                )}
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
