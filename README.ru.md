# TimeSlider Plugin for jQuery
---

> <a href="README.md">English description</a> | Описание на русском

Легкий и удобный плагин для управления отрезками времени.

## Особенности

* Неограниченное кол-во отрезков времени
* Drag and drop

## Демо
[Демо](http://v-v-vishnevskiy.github.io/timeslider/demo/demo.html) страница.

## Зависимости

* <a href="http://jquery.com/" target="_blank">jQuery 1.6.1+</a>

## Использование

1\. Добавитье загрузку библиотеки jQuery
```html
<script src="/путь/до/jquery.min.js"></script>
```
2\. Добавиьте загрузку стилей и JavaScript файлов плагина TimeSlider
```html
<link href="css/timeslider.css" rel="stylesheet">
<script src="js/timeslider.js"></script>
```
3\. Создайте пустой div, который будет являться контейнером плагина
```html
<div id="ts" class="time-slider"></div>
```
4\. Инициализируйте плагин для созданного div
```js
$('#ts').TimeSlider();
```

### Настройки

<table class="options">
    <thead>
        <tr>
            <th>Параметр</th>
            <th>Значение по умолчанию</th>
            <th>Тип</th>
            <th>Описание</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>start_timestamp</td>
            <td>Текущее локальное время</td>
            <td>Integer</td>
            <td>Левая граница, откуда начинается линейка. Число в миллисекундах начиная от 1 января 1970 года.</td>
        </tr>
        <tr>
            <td>current_timestamp</td>
            <td>Текущее локальное время</td>
            <td>Integer</td>
            <td>Текущее время. Число в миллисекундах начиная от 1 января 1970 года. Выглядит в виде красной вертикальной черты.</td>
        </tr>
        <tr>
            <td>hours_per_ruler</td>
            <td>24</td>
            <td>Float</td>
            <td>Длина линейки в часах. Минимальное значение 1, Максимальное значение 48.</td>
        </tr>
        <tr>
            <td>graduation_step</td>
            <td>20</td>
            <td>Integer</td>
            <td>Минимальное кол-во пикселей между разделителями на линейке. Может варьироваться в пределах от 20 до 39. Вычисляется самостоятельно.</td>
        </tr>
        <tr>
            <td>distance_between_gtitle</td>
            <td>80</td>
            <td>Integer</td>
            <td>Минимальное кол-во пикселей между заголовками разделителей.</td>
        </tr>
        <tr>
            <td>update_timestamp_interval</td>
            <td>1000</td>
            <td>Integer</td>
            <td>Время, через которое будет обновляться текущее время. Число в миллисекундах.</td>
        </tr>
        <tr>
            <td>update_interval</td>
            <td>1000</td>
            <td>Integer</td>
            <td>Время, через которое будут обновляться графические элементы. Число в миллисекундах.</td>
        </tr>
        <tr>
            <td>show_ms</td>
            <td>false</td>
            <td>Boolean</td>
            <td>Показывать ли миллисекунды.</td>
        </tr>
        <tr>
            <td>init_cells</td>
            <td>null</td>
            <td>Array|Function</td>
            <td>Добавление отрезков времени при инициализации. Может являться списком отрезков или функцией с контекстом плагина.</td>
        </tr>
        <tr>
            <td>ruler_enable_move</td>
            <td>true</td>
            <td>Boolean</td>
            <td>Разрешение на смещение линейки из интерфейса.</td>
        </tr>
        <tr>
            <td>timecell_enable_move</td>
            <td>true</td>
            <td>Boolean</td>
            <td>Разрешение на смещение отрезка времени из интерфейса.</td>
        </tr>
        <tr>
            <td>timecell_enable_resize</td>
            <td>true</td>
            <td>Boolean</td>
            <td>Разрешение на изменение размера отрезка времени из интерфейса.</td>
        </tr>
        <tr>
            <td>on_add_timecell_callback</td>
            <td>null</td>
            <td>Function</td>
            <td>Функция вызовется после того, как будет добавлен отрезок времени. Функция принимает три входных параметра: <code>id</code> (id отрезка), <code>start</code> (начало отрезка), <code>stop</code> (конец отрезка, может не быть, если отрезок не завершен).</td>
        </tr>
        <tr>
            <td>on_toggle_timecell_callback</td>
            <td>null</td>
            <td>Function</td>
            <td></td>
        </tr>
        <tr>
            <td>on_remove_timecell_callback</td>
            <td>null</td>
            <td>Function</td>
            <td></td>
        </tr>
        <tr>
            <td>on_remove_all_timecells_callback</td>
            <td>null</td>
            <td>Function</td>
            <td></td>
        </tr>
        <tr>
            <td>on_dblclick_timecell_callback</td>
            <td>null</td>
            <td>Function</td>
            <td></td>
        </tr>
        <tr>
            <td>on_move_timecell_callback</td>
            <td>null</td>
            <td>Function</td>
            <td></td>
        </tr>
        <tr>
            <td>on_resize_timecell_callback</td>
            <td>null</td>
            <td>Function</td>
            <td></td>
        </tr>
        <tr>
            <td>on_change_timecell_callback</td>
            <td>null</td>
            <td>Function</td>
            <td></td>
        </tr>
        <tr>
            <td>on_dblclick_ruler_callback</td>
            <td>null</td>
            <td>Function</td>
            <td></td>
        </tr>
        <tr>
            <td>on_move_ruler_callback</td>
            <td>null</td>
            <td>Function</td>
            <td></td>
        </tr>
        <tr>
            <td>on_change_ruler_callback</td>
            <td>null</td>
            <td>Function</td>
            <td></td>
        </tr>
    </tbody>
</table>

## Пожертвования

* PayPal: https://www.paypal.me/vishnevskiy
* Яндекс.Деньги: https://money.yandex.ru/to/410011466316463
