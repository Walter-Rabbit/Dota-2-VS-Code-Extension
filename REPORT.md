# Шевченко Валерий, лабораторная номер 5

## Описание процесса написания плагина

### Идея плагина

Я захотел написать плагин, который будет в VS Code выводить какую-то информацию из доты. Так как мне не хотелось копаться в API от Steam, я воспользовался данными с популярного сайта DotaBuff, на котором лежат данные обо всех зарегистрированных игроках. Сначала я хотел, чтобы просто дата и время последней игры выводились в Status Bar. Потом ещё пришла идея, чтобы по нажатию на виджет, была показана информация из последней игры.

### Получение данных с DotaBuff

Я отправляю Get запрос на сайт и получаю Html файл страницы со всеми матчами нужного игрока. ID игрока я поначалу просто хардкодил, так как ещё не использовал возможность хранить данные в конфигурации. Дальше, огромный Html код я паршу с помощью регулярок.

### Добавление виджета в Status Bar

Добавление элемента в Status Bar выглдит так:

```ts
myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
myStatusBarItem.tooltip = "Show last dota game info";
myStatusBarItem.command = lastGameIdCommand;
myStatusBarItem.text = 'Последняя игра в доту была в ' + time;
myStatusBarItem.show();
subscriptions.push(myStatusBarItem);
```

Из объекта vscode достаются все элементы запущенной IDE. В window хранятся элементы, связанные с окном, поэтом оттуда можно достать Status Bar. Дальше виджету можно задать надпись, всплывающая при наведении, текс самого виджета и команду, которая выполнится по нажатию, к ней перейдём потом.

### Использование файла конфигурации

Чтобы пользователь не вводил каждый раз свой ID, нужно хранить его в файле конфигурации. Получить этот файл можно следующим образом:

```ts
let config = vscode.workspace.getConfiguration();
let userId = config.get('conf.dota-extension.user-dota-buff-id');
```

Название свойства в конфигурации задаётся в pakage.json:

```json
"contributes": {
  "configuration": [
    {
      "id": "dota-extension",
      "title": "Dota buff user info",
      "properties": {
        "conf.dota-extension.user-dota-buff-id": {
        "type": "string | undefined",
        "description": "ID of user dota buff profile."
        }
      }
    }
  ]
}
```

Обновить значение в конфиграции можно так:

```ts
config.update('conf.dota-extension.user-dota-buff-id', userId, vscode.ConfigurationTarget.Global);
```

Важно указать, чтобы использовалась глобальная конфигурация. Если этого не указывать, то будет создаваться локальный конфигурационный файл для текущего проекта.

### Добавление команд

Мне в плагине нужно 2 команды. Команда, с помощью которой пользователь задаёт свой ID и команда, которая выполняется при нажатии на виджет. Команды нужно указать в package.json:

```json
"contributes": {
  "commands": [
    {
      "command": "dota-extension.update-user-id",
      "title": "Enter dotabuff user id"
    },
    {
      "command": "dota-extension.show-last-game",
      "title": "Show last dota game info"
    }
  ]
}
```

Сама команда регистрируется и создаётся так:

```ts
subscriptions.push(vscode.commands.registerCommand(lastGameIdCommand, async () => {
    // тело команды
}
```

Для первой команды нужно, чтобы после выполенния команды, у пользователя был запрошены данные. Это можно сделать так:

```ts
let userInput = await vscode.window.showInputBox({
    placeHolder: "Dotabuff ID",
    prompt: "Enter your dotabuff ID",
    value: `${userId}`
});
```

Для второй команды нужно, чтобы информация вывелась в Message Box, поэтому нужнен соответствующий метод из vscode.window:

```ts
vscode.window.showInformationMessage(`${gameResult} в игре на ${gameHero} длительностью ${gameDuration}. В игре вы совершили ${gameKills} убийств.`);
```

## Вывод

Так как VS Code написан на Chromium, то он во многом похож на браузер в плане разработки плагинов на него. Поэтому я несколько раз ловил себя на мысли, будто я делаю сейчас лабораторную по вебу, а не плагин пишу.
