# TimeSlider Plugin for jQuery
---

> English description | <a href="README.ru.md">Описание на русском</a>

Lightweight and usable plugin for timeline management.

## Features

* Any number of time cells at one page.
* Drag and drop

## Demo
[Demo](http://v-v-vishnevskiy.github.io/timeslider/demo/demo.html) page.

## Dependencies

* <a href="http://jquery.com/" target="_blank">jQuery 1.6.1+</a>

## Usage

1\. Load jQuery library
```html
<script src="/path/to/jquery.min.js"></script>
```
2\. Load TimeSlider plugin's stylesheet and JavaScript
```html
<link href="css/timeslider.css" rel="stylesheet">
<script src="js/timeslider.js"></script>
```
3\. Create an empty DIV element that will be served as the container for the plugin
```html
<div id="ts" class="time-slider"></div>
```
4\. Initialize the plugin and we're ready to go.
```js
$('#ts').TimeSlider();
```

### Settings

<table class="options">
    <thead>
        <tr>
            <th>Option</th>
            <th>Default</th>
            <th>Type</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>start_timestamp</td>
            <td>Current local time</td>
            <td>Integer</td>
            <td>Left border from which starts the ruler. Timestamp in milliseconds since January 1 1970.</td>
        </tr>
        <tr>
            <td>current_timestamp</td>
            <td>Current local time</td>
            <td>Integer</td>
            <td>Current time. Timestamp in milliseconds. Red vertical line.</td>
        </tr>
        <tr>
            <td>hours_per_ruler</td>
            <td>24</td>
            <td>Float</td>
            <td>Length of the ruler in hours. Min is 1, Max is 48.</td>
        </tr>
        <tr>
            <td>graduation_step</td>
            <td>20</td>
            <td>Integer</td>
            <td>Minimum pixels between graduations on the ruler. It can vary from 20 to 39. Calculated independently.</td>
        </tr>
        <tr>
            <td>distance_between_gtitle</td>
            <td>80</td>
            <td>Integer</td>
            <td>Minimum pixels between titles of graduations.</td>
        </tr>
        <tr>
            <td>update_timestamp_interval</td>
            <td>1000</td>
            <td>Integer</td>
            <td>Interval through which will update the current time. In milliseconds.</td>
        </tr>
        <tr>
            <td>update_interval</td>
            <td>1000</td>
            <td>Integer</td>
            <td>Interval through which will updates the graphical elements. In milliseconds.</td>
        </tr>
        <tr>
            <td>show_ms</td>
            <td>false</td>
            <td>Boolean</td>
            <td>Whether to show the milliseconds?</td>
        </tr>
        <tr>
            <td>init_cells</td>
            <td>null</td>
            <td>Array|Function</td>
            <td>Add time cells on initial. Can be list of time cells or a function with plugin context.</td>
        </tr>
        <tr>
            <td>ruler_enable_move</td>
            <td>true</td>
            <td>Boolean</td>
            <td>Enabling on move the ruler from UI.</td>
        </tr>
        <tr>
            <td>timecell_enable_move</td>
            <td>true</td>
            <td>Boolean</td>
            <td>Enabling on move time cells from UI.</td>
        </tr>
        <tr>
            <td>timecell_enable_resize</td>
            <td>true</td>
            <td>Boolean</td>
            <td>Enabling on resizing time cells from UI.</td>
        </tr>
        <tr>
            <td>on_add_timecell_callback</td>
            <td>null</td>
            <td>Function</td>
            <td>Callback. Is called after add time cell. Callback has 3 parameters: <code>id</code> (id of time cell), <code>start</code> (the start point of time cell), <code>stop</code> (the end point of time cell, can be not set if time cell is not finished).</td>
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

## Donations

* PayPal: https://www.paypal.me/vishnevskiy
* Yandex.Money: https://money.yandex.ru/to/410011466316463
