# Style Guide - Система мониторинга REMOSA

## Цветовая палитра

### Основные цвета
- **Primary Dark**: #1F2937 (gray-800) - фон sidebar, основные панели
- **Primary Light**: #374151 (gray-700) - hover состояния, акценты
- **Background**: #111827 (gray-900) - основной фон приложения
- **Surface**: #FFFFFF - фон модальных окон, карточек

### Акцентные цвета
- **Cyan**: #06B6D4 (cyan-500) - основные действия, навигация
- **Green**: #10B981 (emerald-500) - success состояния, статусы "ок"
- **Orange**: #F59E0B (amber-500) - предупреждения, важные элементы
- **Red**: #EF4444 (red-500) - ошибки, удаление
- **Purple**: #8B5CF6 (violet-500) - специальные действия

### Текстовые цвета
- **Primary Text**: #F9FAFB (gray-50) - основной текст на темном фоне
- **Secondary Text**: #D1D5DB (gray-300) - вторичный текст
- **Muted Text**: #6B7280 (gray-500) - неактивный текст
- **Dark Text**: #1F2937 (gray-800) - текст на светлом фоне

## Типографика

### Шрифты
- **Основной**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Моноширинный**: 'Fira Code', Consolas, 'Monaco', monospace

### Размеры текста
- **h1**: text-3xl (30px) font-bold
- **h2**: text-2xl (24px) font-semibold  
- **h3**: text-xl (20px) font-semibold
- **h4**: text-lg (18px) font-medium
- **Body**: text-base (16px) font-normal
- **Small**: text-sm (14px)
- **Caption**: text-xs (12px)

## Отступы и размеры

### Spacing Scale (Tailwind)
- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)

### Компоненты
- **Sidebar width**: 16rem (256px)
- **Button height**: 2.5rem (40px)
- **Input height**: 2.5rem (40px)
- **Card padding**: 1.5rem (24px)
- **Border radius**: 0.375rem (6px)

## Компоненты UI

### Кнопки
```tsx
// Primary Button
className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-md font-medium transition-colors"

// Secondary Button  
className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-md font-medium transition-colors"

// Danger Button
className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
```

### Поля ввода (Material-UI интеграция)
```tsx
<TextField
  sx={{
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'white',
      '& fieldset': { borderColor: '#D1D5DB' },
      '&:hover fieldset': { borderColor: '#06B6D4' },
      '&.Mui-focused fieldset': { borderColor: '#06B6D4' }
    }
  }}
/>
```

### Карточки и панели
```tsx
// Card
className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"

// Dark Card (для темной темы)
className="bg-gray-800 rounded-lg border border-gray-700 p-6"
```

### Навигация
```tsx
// Sidebar Link
className="flex items-center py-2 px-3 text-gray-300 hover:bg-gray-700 rounded-md transition-colors"

// Active Link
className="flex items-center py-2 px-3 text-cyan-400 bg-gray-700 rounded-md"
```

## Принципы дизайна

### Основные принципы
1. **Clarity** - Четкость и понятность интерфейса
2. **Consistency** - Единообразие элементов
3. **Accessibility** - Доступность для всех пользователей  
4. **Efficiency** - Эффективность использования

### Hierarchy
- Используем размеры шрифтов и цвета для создания визуальной иерархии
- Важные действия выделяем яркими цветами (cyan, green)
- Деструктивные действия - красным цветом

### Spacing
- Используем 8px сетку для отступов
- Группируем связанные элементы ближе друг к другу
- Разделяем разные группы достаточными отступами

### Icons
- Используем Lucide React icons для согласованности
- Размеры: 16px для мелких элементов, 18px для навигации, 24px для заголовков
- Цвета иконок соответствуют цветам текста/действий

## Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

### Адаптивность
- Sidebar скрывается на мобильных устройствах
- Таблицы становятся прокручиваемыми
- Модальные окна адаптируются под размер экрана

## Accessibility

### Требования
- Контрастность не менее 4.5:1 для основного текста
- Контрастность не менее 3:1 для крупного текста
- Все элементы доступны с клавиатуры
- Используем семантические HTML теги
- Добавляем ARIA атрибуты для сложных компонентов

### Focus States
```tsx
// Focus Ring
className="focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800"
```
