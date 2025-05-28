import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';

import { DOMUtils } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';

import { requestAPI } from './handler';

interface IMyCommand {
  command: string;
  label: string;
  caption: string;
  action(): void;
}

/**
 * Initialization data for the jlab_noteable_laf extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jlab_noteable_laf:plugin',
  description: 'Trying to replicate the Noteable look and feel for JupyterLab panel.',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILayoutRestorer],
  activate: activate
};

const TOP_AREA_CSS_CLASS = 'jp-TopAreaText';
let notebookTypeIconUrl: string = '';
let notebookType: string = '';

/**
 * Activate the APOD widget extension.
 */
function activate(
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    restorer: ILayoutRestorer | null) {

  // Try avoiding awaiting in the activate function because
  // it will delay the application start up time.
  requestAPI<any>('env')
      .then(data => {
        console.log(data);
        notebookTypeIconUrl = data.iconTypeUrl;
        notebookType = data.notebookType;
        setupIcons(app);
      })
      .catch(reason => {
        console.error(
            `The jlab_noteable_laf server extension appears to be missing: \n${reason.message}`
        );
      });

  // Add Noteable icons
  // getLocalSetting();
  setupCommands(app, palette);
  setupMenu(app, palette);
}

function setupIcons(app: JupyterFrontEnd) {
  /*
  / Create the HTML content of the widget
  */
  const node = document.createElement('section');
  node.setAttribute('id', 'noteable-logo-section');
  node.setAttribute('aria-label', 'notable logos');

  if(notebookTypeIconUrl !== '') {
    const notebookTypeLogo = document.createElement('img');
    notebookTypeLogo.setAttribute('alt', notebookType + ' logo');
    notebookTypeLogo.setAttribute('id', 'notebook-type-icon');
    notebookTypeLogo.setAttribute('class', 'notebook-type');
    notebookTypeLogo.setAttribute('title', notebookType);
    notebookTypeLogo.setAttribute(
        'src',
        notebookTypeIconUrl
    );
    node.appendChild(notebookTypeLogo);
  }

  const lpAnchor = document.createElement('a');
  lpAnchor.setAttribute('id', 'noteable_home_link');
  lpAnchor.setAttribute('href', '/launch');

  const noteableLogo = document.createElement('img');
  noteableLogo.setAttribute('alt', 'Return to the Launch Page');
  noteableLogo.setAttribute('id', 'noteable-logo');
  noteableLogo.setAttribute(
      'src',
      'https://noteable.edina.ac.uk/images/logo_noteable.svg'
  );
  lpAnchor.appendChild(noteableLogo);
  node.appendChild(lpAnchor);

  // Create the widget
  const widget = new Widget({ node });
  widget.id = DOMUtils.createDomID();
  widget.addClass(TOP_AREA_CSS_CLASS);

  // Add the widget to the top area
  app.shell.add(widget, 'top', { rank: 1000 });
}

function setupMenu(app: JupyterFrontEnd,
                   palette: ICommandPalette) {
  const command = 'noteable-laf:go2LaunchPage';
  const category = 'Noteable';
  palette.addItem({
    command,
    category,
    args: { origin: 'from the palette' }
  });
}

function setupCommands(
    app: JupyterFrontEnd,
    palette: ICommandPalette,
) {
  const myCommands: Array<IMyCommand> = [];
  myCommands.push({
    command: 'noteable-laf:go2LaunchPage',
    label: 'Return to the Launch page',
    caption: 'Return to the Launch page (to shut your notebook down)',
    action: () => window.location.assign('/launch')
  });
  myCommands.push({
    command: 'noteable-laf:go2Resources',
    label: 'View Resources page',
    caption: 'Open the Noteable Resources page (in a new tab)',
    action: () => window.open('/resources/')
  });
  myCommands.push({
    command: 'noteable-laf:go2HelpAndGuides',
    label: 'View Help and Guides page',
    caption: 'Open the Noteable Help and Guides page (in a new tab)',
    action: () => window.open('/help_guides/')
  });

  /*
  / Add a command to the central command-palette
  */
  const { commands } = app;
  const category = 'Noteable';

  myCommands.forEach(myCommand => {
    const command = myCommand.command;

    // Add a command
    commands.addCommand(command, {
      label: myCommand.label,
      caption: myCommand.caption,
      isEnabled: () => true,
      isVisible: () => true,
      execute: (args: any) => {
        if (args['origin'] !== 'init') {
          myCommand.action();
        }
      }
    });

    palette.addItem({ command, category, args: { origin: 'from palette' } });

    // Call the command execution
    commands.execute(command, { origin: 'init' }).catch(reason => {
      console.error(
          `An error occurred during the execution of ${command}.\n${reason}`
      );
    });
  });
}

// function getLocalSetting() {
//   // Try avoiding awaiting in the activate function because
//   // it will delay the application start up time.
//   requestAPI<any>('settings')
//       .then(data => {
//         notebookTypeIconUrl = data.iconTypeUrl;
//       })
//       .catch(reason => {
//         console.error(
//             `The jlab_noteable_laf server extension appears to be missing.\n${reason}`
//         );
//       });
// }

export default plugin;
