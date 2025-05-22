import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';

import { LabIcon } from '@jupyterlab/ui-components';
import notebookTypeIcon from '../style/notebook-type.svg';
import { notebookInfo } from "./notebook_info";

import { DOMUtils } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';

interface APODResponse {
  copyright: string;
  date: string;
  explanation: string;
  media_type: 'video' | 'image';
  title: string;
  url: string;
}

interface IMyCommand {
  command: string;
  label: string;
  caption: string;
  action(): void;
}

class APODWidget extends Widget {
  /**
   * Construct a new APOD widget.
   */
  constructor() {
    super();

    this.addClass('my-apodWidget');

    // Add an image element to the panel
    this.img = document.createElement('img');
    this.node.appendChild(this.img);

    // Add a summary element to the panel
    this.summary = document.createElement('p');
    this.node.appendChild(this.summary);
  }

  /**
   * The image element associated with the widget.
   */
  readonly img: HTMLImageElement;

  /**
   * The summary text element associated with the widget.
   */
  readonly summary: HTMLParagraphElement;

  /**
   * Handle update requests for the widget.
   */
  async updateAPODImage(): Promise<void> {

    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=${this.randomDate()}`);

    if (!response.ok) {
      const data = await response.json();
      if (data.error) {
        this.summary.innerText = data.error.message;
      } else {
        this.summary.innerText = response.statusText;
      }
      return;
    }

    const data = await response.json() as APODResponse;

    if (data.media_type === 'image') {
      // Populate the image
      this.img.src = data.url;
      this.img.title = data.title;
      this.summary.innerText = data.title;
      if (data.copyright) {
        this.summary.innerText += ` (Copyright ${data.copyright})`;
      }
    } else {
      this.summary.innerText = 'Random APOD fetched was not an image.';
    }
  }

  /**
   * Get a random date string in YYYY-MM-DD format.
   */
  randomDate(): string {
    const start = new Date(2010, 1, 1);
    const end = new Date();
    const randomDate = new Date(start.getTime() + Math.random()*(end.getTime() - start.getTime()));
    return randomDate.toISOString().slice(0, 10);
  }
}

/**
 * Initialization data for the jupyterlab_apod extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_apod:plugin',
  description: 'Trying to replicate the Noteable look and feel for JupyterLab panel.',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILayoutRestorer],
  activate: activate
};

const TOP_AREA_CSS_CLASS = 'jp-TopAreaText';

/**
 * Activate the APOD widget extension.
 */
function activate(
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    restorer: ILayoutRestorer | null) {
  setupAPOD(app, palette, restorer);

  // Add Noteable icons
  setupIcons(app);
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

  if (notebookInfo.iconType === 'svg') {
    const icon: LabIcon = new LabIcon({ name: 'notebook-type-icon', svgstr: notebookTypeIcon });
    node.appendChild(icon.element({
      className: 'notebook-type',
      height: '26px',
      width: 'auto',
      elementPosition: 'right',
      title: notebookInfo.title,
      tag: 'span',
    }));
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
    action: () => window.open('/help_guides')
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

function setupAPOD(app: JupyterFrontEnd<JupyterFrontEnd.IShell, "desktop" | "mobile">, palette: ICommandPalette, restorer: ILayoutRestorer | null) {
  console.log('JupyterLab extension jupyterlab_apod is activated!');

  // Declare a widget variable
  let widget: MainAreaWidget<APODWidget>;

  // Add an application command
  const command: string = 'apod:open';
  app.commands.addCommand(command, {
    label: 'Random Astronomy Picture',
    execute: () => {
      if (!widget || widget.isDisposed) {
        const content = new APODWidget();
        widget = new MainAreaWidget({content});
        widget.id = 'apod-jupyterlab';
        widget.title.label = 'Astronomy Picture';
        widget.title.closable = true;
      }
      if (!tracker.has(widget)) {
        // Track the state of the widget for later restoration
        tracker.add(widget);
      }
      if (!widget.isAttached) {
        // Attach the widget to the main work area if it's not there
        app.shell.add(widget, 'main');
      }
      widget.content.updateAPODImage();

      // Activate the widget
      app.shell.activateById(widget.id);
    }
  });

  // Add the command to the palette.
  palette.addItem({command, category: 'Tutorial'});

  // Track and restore the widget state
  let tracker = new WidgetTracker<MainAreaWidget<APODWidget>>({
    namespace: 'apod'
  });
  if (restorer) {
    restorer.restore(tracker, {
      command,
      name: () => 'apod'
    });
  }
}

export default plugin;
