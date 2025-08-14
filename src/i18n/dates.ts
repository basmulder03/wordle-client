import {useI18n} from "./index.tsx";

export function useDateFmt() {
    const {lang} = useI18n();
    const dateFmt = new Intl.DateTimeFormat(lang, {year: 'numeric', month: 'long', day: 'numeric'});
    const weekdayFmt = new Intl.DateTimeFormat(lang, {weekday: 'long'});
    const timeFmt = new Intl.DateTimeFormat(lang, {hour: '2-digit', minute: '2-digit'});

    return {
        formatDate: (d: Date | string | number) => dateFmt.format(new Date(d)),
        formatWeekday: (d: Date | string | number) => weekdayFmt.format(new Date(d)),
        formatTime: (d: Date | string | number) => timeFmt.format(new Date(d))
    };
}