import fs from 'fs';
import path from 'path';
import React from 'react';
import { remote } from 'electron';
import { createEvent, fireEvent, render,
         waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import InvestJob from '../src/InvestJob';
import { getSpec, fetchDatastackFromFile, fetchValidation } from '../src/server_requests';
jest.mock('../src/server_requests');
import { fileRegistry } from '../src/constants'

beforeEach(() => {
  jest.resetAllMocks()
})

// TODO: refer to this obj
const MODEL = 'Carbon'
const MODULE = 'carbon'
const INVEST_LIST = { [MODEL]: { internal_name: MODULE } };

function renderSetupFromSpec(spec) {
  // some ARGS_SPEC boilerplate that is not under test,
  // but is required by PropType-checking
  if (!spec.model_name) { spec.model_name = 'Eco Model' }
  if (!spec.module) { spec.module = 'natcap.invest.dot' }

  getSpec.mockResolvedValue(spec);
  const { getByText, getByLabelText, ...utils } = render(
    <InvestJob
      investExe = ''
      investList={INVEST_LIST}
      investSettings={{nWorkers: '-1', loggingLevel: 'INFO'}}
      recentSessions={[]}
      jobDatabase={fileRegistry.JOBS_DATABASE}
      updateRecentSessions={() => {}}
      saveSettings={() => {}}
    />);
  return { getByText, getByLabelText, utils }
}

test('SetupTab: expect an input form for a directory', async () => {
  const spec = { args: { arg: { 
    name: 'Workspace',
    type: 'directory',
    about: 'this is a workspace' } } }
  fetchValidation.mockResolvedValue(
    [[Object.keys(spec.args), 'invalid because']])
  const { getByText, getByLabelText, utils } = renderSetupFromSpec(spec)
  fireEvent.click(getByText(MODEL));
  const input = await utils.findByLabelText(RegExp(`${spec.args.arg.name}`))
  fireEvent.change(input, { target: { value: 'foo' } })
  await waitFor(() => {
    expect(input).toHaveValue('foo')
    expect(input).toHaveAttribute('type', 'text')
    expect(input.classList.contains('is-invalid')).toBeTruthy();
    expect(getByText('Browse'))
    expect(getByText('invalid because', { exact: false }))
  })

  // Expect the info dialog contains the about text, when clicked
  fireEvent.click(getByText('i'))
  expect(getByText(spec.args.arg.about)).toBeTruthy()
})

test('SetupTab: expect an input form for a csv', async () => {
  /** Also testing the browse button functionality */

  const spec = { args: { arg: { name: 'foo', type: 'csv' } } }
  fetchValidation.mockResolvedValue(
    [[Object.keys(spec.args), 'invalid because']])
  const { getByText, getByLabelText, utils } = renderSetupFromSpec(spec)
  fireEvent.click(getByText(MODEL));
  const input = await utils.findByLabelText(RegExp(`${spec.args.arg.name}`))
  // Typing in a value
  fireEvent.change(input, { target: { value: 'foo' } })
  await waitFor(() => {
    expect(input).toHaveValue('foo')
    expect(input).toHaveAttribute('type', 'text')
    expect(input.classList.contains('is-invalid')).toBeTruthy();
    expect(getByText('Browse'))
    expect(getByText('invalid because', { exact: false }))
  })

  // Browsing for a file
  const filepath = 'grilled_cheese.csv'
  let mockDialogData = { filePaths: [filepath] }
  remote.dialog.showOpenDialog.mockResolvedValue(mockDialogData)
  fireEvent.click(getByText('Browse'))
  await waitFor(() => {
    expect(input).toHaveValue(filepath)
    expect(input.classList.contains('is-invalid')).toBeTruthy();
    expect(getByText('invalid because', { exact: false }))
  })

  // Now browse again, but this time cancel it and expect the previous value
  mockDialogData = { filePaths: [] } // empty array is a mocked 'Cancel'
  remote.dialog.showOpenDialog.mockResolvedValue(mockDialogData)
  fireEvent.click(getByText('Browse'))
  await waitFor(() => {
    expect(input).toHaveValue(filepath)
    expect(input.classList.contains('is-invalid')).toBeTruthy();
    expect(getByText('invalid because', { exact: false }))
  })

})

test('SetupTab: expect an input form for a vector', async () => {
  const spec = { args: { arg: { name: 'foo', type: 'vector' } } }
  fetchValidation.mockResolvedValue(
    [[Object.keys(spec.args), 'invalid because']])
  const { getByText, getByLabelText, utils } = renderSetupFromSpec(spec)
  fireEvent.click(getByText(MODEL));
  const input = await utils.findByLabelText(RegExp(`${spec.args.arg.name}`))
  fireEvent.change(input, { target: { value: 'foo' } })
  await waitFor(() => {
    expect(input).toHaveValue('foo')
    expect(input).toHaveAttribute('type', 'text')
    expect(input.classList.contains('is-invalid')).toBeTruthy();
    expect(getByText('Browse'))
    expect(getByText('invalid because', { exact: false }))
  })
})

test('SetupTab: expect an input form for a raster', async () => {
  const spec = { args: { arg: { name: 'foo', type: 'raster' } } }
  fetchValidation.mockResolvedValue(
    [[Object.keys(spec.args), 'invalid because']])
  const { getByText, getByLabelText, utils } = renderSetupFromSpec(spec)
  fireEvent.click(getByText(MODEL));
  const input = await utils.findByLabelText(RegExp(`${spec.args.arg.name}`))
  fireEvent.change(input, { target: { value: 'foo' } })
  await waitFor(() => {
    expect(input).toHaveValue('foo')
    expect(input).toHaveAttribute('type', 'text')
    expect(input.classList.contains('is-invalid')).toBeTruthy();
    expect(getByText('Browse'))
    expect(getByText('invalid because', { exact: false }))
  })
})

test('SetupTab: expect an input form for a freestyle_string', async () => {
  // This turned out to be an important test that caught an unrelated bug
  // that all other tests missed -- changing only the `value` of the input
  // while not changing the validation state revealed the problem of using
  // a PureComponent for ArgsForm. PureComponents check for shallow-equality
  // of props and avoid re-rendering if equal. This test alone maintained
  // shallow-equality in a case where we definitely do need to re-render. 
  const spec = { args: { arg: { name: 'foo', type: 'freestyle_string' } } }
  fetchValidation.mockResolvedValue([])
  const { getByText, getByLabelText, utils } = renderSetupFromSpec(spec)
  fireEvent.click(getByText(MODEL));
  const input = await utils.findByLabelText(RegExp(`${spec.args.arg.name}`))
  fireEvent.change(input, { target: { value: 'foo' } })
  await waitFor(() => {
    expect(input).toHaveValue('foo')
    expect(input).toHaveAttribute('type', 'text')
    // Not really possible to invalidate a freestyle_string
    expect(input.classList.contains('is-invalid')).toBeFalsy();
  })
})

test('SetupTab: expect an input form for a number', async () => {
  const spec = { args: { arg: { name: 'foo', type: 'number' } } }
  fetchValidation.mockResolvedValue(
    [[Object.keys(spec.args), 'invalid because']])
  const { getByText, getByLabelText, utils } = renderSetupFromSpec(spec)
  fireEvent.click(getByText(MODEL));
  const input = await utils.findByLabelText(RegExp(`${spec.args.arg.name}`))
  fireEvent.change(input, { target: { value: 'foo' } })
  await waitFor(() => {
    expect(input).toHaveValue('foo')
    expect(input).toHaveAttribute('type', 'text')
    expect(input.classList.contains('is-invalid')).toBeTruthy();
    expect(getByText('invalid because', { exact: false }))
  })
})

test('SetupTab: expect an input form for a boolean', async () => {
  const spec = { args: { arg: { name: 'foo', type: 'boolean' } } }
  fetchValidation.mockResolvedValue([])
  const { getByText, getByLabelText, utils } = renderSetupFromSpec(spec)
  fireEvent.click(getByText(MODEL));
  const input = await utils.findByLabelText(RegExp(`${spec.args.arg.name}`))
  await waitFor(() => {
    expect(input).toHaveAttribute('type', 'radio')
  })
})

test('SetupTab: expect an input form for an option_string', async () => {
  const spec = { args: { arg: { 
    name: 'foo', 
    type: 'option_string', 
    validation_options: { options: ['a', 'b'] } } } }
  fetchValidation.mockResolvedValue([])
  const { getByText, getByLabelText, utils } = renderSetupFromSpec(spec)
  fireEvent.click(getByText(MODEL));
  const input = await utils.findByLabelText(RegExp(`${spec.args.arg.name}`))
  await waitFor(() => {
    expect(input).toHaveValue('a');
    expect(input).not.toHaveValue('b');
  })
})

test('SetupTab: test a UI spec with a boolean controller arg', async () => {
  
  const spec = { module: 'natcap.invest.dummy', args: { 
    controller: { 
      name: 'Afoo', 
      type: 'boolean'}, 
    arg2: { 
      name: 'Bfoo', 
      type: 'number'}, 
    arg3: { 
      name: 'Cfoo', 
      type: 'number'}, 
    arg4: { 
      name: 'Dfoo', 
      type: 'number'},
    arg5: {
      name: 'Efoo',
      type: 'number'
    } } }

  const ui_spec = {
    controller: { 
      ui_control: ['arg2', 'arg3', 'arg4'], },
    arg2: { 
      ui_option: 'disable', },
    arg3: { 
      ui_option: 'hide', },
    arg4: { 
      ui_option: 'foo', } }  // an invalid option should be ignored
    // arg5 is deliberately missing from ui_spec to demonstrate that that is okay. 

  fs.writeFileSync(path.join(
    fileRegistry.INVEST_UI_DATA, spec.module + '.json'),
      JSON.stringify(ui_spec))
  
  fetchValidation.mockResolvedValue([])
  const { getByText, getByLabelText, utils } = renderSetupFromSpec(spec)
  fireEvent.click(getByText(MODEL));

  const controller = await utils.findByLabelText(RegExp(`${spec.args.controller.name}`))
  const arg2 = await utils.findByLabelText(RegExp(`${spec.args.arg2.name}`))
  const arg3 = await utils.findByLabelText(RegExp(`${spec.args.arg3.name}`))
  const arg4 = await utils.findByLabelText(RegExp(`${spec.args.arg4.name}`))
  const arg5 = await utils.findByLabelText(RegExp(`${spec.args.arg5.name}`))

  // Boolean Radios should default to "false" when a spec is loaded
  await waitFor(() => {
    expect(arg2).toBeDisabled();
    // The 'hide' style is applied to the whole Form.Group which 
    // includes the Label and Input. Right now, the only good way
    // to query the Form.Group node is using a data-testid property.
    expect(utils.getByTestId('group-arg3')).toHaveClass('arg-hide')

    // These inputs are not being controlled, but should exist:
    expect(arg4).toBeVisible();
    expect(arg4).toBeEnabled();
    expect(arg5).toBeVisible();
    expect(arg5).toBeEnabled();
  })
  // fireEvent.change doesn't trigger the change handler but .click does
  // even though React demands an onChange handler for controlled checkbox inputs.
  // https://github.com/testing-library/react-testing-library/issues/156
  fireEvent.click(controller, { target: { value: "true" } })

  // Now everything should be visible/enabled.
  await waitFor(() => {
    expect(arg2).toBeEnabled();
    expect(arg2).toBeVisible();
    expect(arg3).toBeEnabled();
    expect(arg3).toBeVisible();
    expect(arg4).toBeEnabled();
    expect(arg4).toBeVisible();
    expect(arg5).toBeEnabled();
    expect(arg5).toBeVisible();
  })
})

test('SetupTab: expect non-boolean input can disable/hide optional inputs', async () => {
  // Normally the UI options are loaded from a seperate spec on disk
  // that is merged with ARGS_SPEC. But for testing, it's convenient
  // to just use one spec. And it works just the same.
  const spec = { args: { 
    controller: { 
      name: 'afoo', 
      type: 'csv', 
      ui_control: ['arg2'], },
    arg2: { 
      name: 'bfoo', 
      type: 'number', 
      ui_option: 'disable', } } }
  
  fetchValidation.mockResolvedValue([])
  const { getByText, getByLabelText, utils } = renderSetupFromSpec(spec)
  fireEvent.click(getByText(MODEL));

  const controller = await utils.findByLabelText(RegExp(`${spec.args.controller.name}`))
  const arg2 = await utils.findByLabelText(RegExp(`${spec.args.arg2.name}`))

  // The optional input should be disabled while the controlling input
  // has a falsy value (undefined or '')
  await waitFor(() => {
    expect(arg2).toBeDisabled();
  })

  fireEvent.change(controller, { target: { value: "foo.csv" } })

  // Now everything should be enabled.
  await waitFor(() => {
    expect(arg2).toBeEnabled();
  })
})
 
test('SetupTab: test grouping and sorting of args', async () => {
  const spec = { module: 'natcap.invest.dummy', args: {
    arg1: { 
      name: 'A', 
      type: 'boolean'}, 
    arg2: { 
      name: 'B', 
      type: 'number'}, 
    arg3: { 
      name: 'C', 
      type: 'number'}, 
    arg4: { 
      name: 'D', 
      type: 'number'},
    arg5: {
      name: 'E',
      type: 'number'},
    arg6: {
      name: 'F',
      type: 'number'}
    } }

  const ui_spec = {
    arg1: { order: 2 },
    arg2: { order: 1.1 },
    arg3: { order: 1 },
    arg4: { order: 0 },
    arg5: {},  // order is deliberately missing, it should end up last. 
    arg6: { order: 'hidden' }  // should not be included in the setup form
  }

  fs.writeFileSync(path.join(
    fileRegistry.INVEST_UI_DATA, spec.module + '.json'),
      JSON.stringify(ui_spec))
  
  fetchValidation.mockResolvedValue([])
  const { getByText, getByLabelText, utils } = renderSetupFromSpec(spec)
  fireEvent.click(getByText(MODEL));

  const form = await utils.findByTestId('setup-form')

  await waitFor(() => {
    // The form should have one child node per arg group
    // 2 of the 5 args share a group and 1 arg is hidden
    expect(form.childNodes.length).toEqual(4)
    // Input nodes should be in the order defined in ui_spec
    expect(form.childNodes[0])
      .toHaveTextContent(RegExp(`${spec.args.arg4.name}`))
    expect(form.childNodes[1].childNodes[0])
      .toHaveTextContent(RegExp(`${spec.args.arg3.name}`))
    expect(form.childNodes[1].childNodes[1])
      .toHaveTextContent(RegExp(`${spec.args.arg2.name}`))
    expect(form.childNodes[2])
      .toHaveTextContent(RegExp(`${spec.args.arg1.name}`))
    expect(form.childNodes[3])
      .toHaveTextContent(RegExp(`${spec.args.arg5.name}`))
  })

})

test('SetupTab: populating inputs to enable & disable Execute', async () => {
  /*
  This tests that changes to input values trigger validation. 
  The fetchValidation return value is always mocked, but then this
  also tests that validation results correctly enable/disable the 
  Execute button and display feedback messages on invalid inputs.
  */
  const spec = { args: {
    a: { 
      name: 'afoo', 
      type: 'freestyle_string'},
    b: {
      name: 'bfoo', 
      type: 'number'},
    c: {
      name: 'cfoo',
      type: 'csv'} } }

  const { getByText, getByLabelText, utils } = renderSetupFromSpec(spec)
  
  let invalidFeedback = 'is a required key'
  fetchValidation.mockResolvedValue([[['a', 'b'], invalidFeedback]])
  fireEvent.click(getByText(MODEL)); // triggers validation
  await waitFor(() => {
    expect(getByText('Execute')).toBeDisabled();
    // The inputs are invalid so the invalid feedback message is present.
    // But, the inputs have not yet been touched, so the message is hidden
    // by CSS 'display: none'. Unfortunately, the bootstrap stylesheet is
    // not loaded in this testing DOM, so cannot assert the message is not visible.
    utils.getAllByText(invalidFeedback, { exact: false }).forEach(element => {
      expect(element).toBeInTheDocument()
      // Would be nice if these worked, but they do not:
      // expect(element).not.toBeVisible()
      // expect(element).toHaveStyle('display: none')
    })
  })
  
  const [a, b, c] = await waitFor(() => {
    return [
      getByLabelText(RegExp(`${spec.args.a.name}`)),
      getByLabelText(RegExp(`${spec.args.b.name}`)),
      getByLabelText(RegExp(`${spec.args.c.name}`))]
  })

  // These new values will be valid - Execute should enable
  fetchValidation.mockResolvedValue([])
  fireEvent.change(a, { target: { value: 'foo' } })  // triggers validation
  fireEvent.change(b, { target: { value: 1 } })      // triggers validation
  await waitFor(() => {
    expect(getByText('Execute')).toBeEnabled();
  })
  // Now that inputs are valid, feedback message should be cleared:
  // Note: Can't put this inside wait - it will timeout waiting to be not null.
  // But it does rely on waiting for the change event to propogate. 
  // Putting it after the above `await` works.
  utils.queryAllByText(invalidFeedback, { exact: false }).forEach(element => {
    expect(element).toBeNull()
  })

  // This new value will be invalid - Execute should disable
  invalidFeedback = 'must be a number';
  fetchValidation.mockResolvedValue([[['b'], invalidFeedback]])
  fireEvent.change(b, { target: { value: 'one' } })  // triggers validation
  await waitFor(() => {
    expect(getByText('Execute')).toBeDisabled();
    expect(getByText(invalidFeedback, { exact: false })).toBeInTheDocument()
  })
})

test('SetupTab: test validation payload is well-formatted', async () => {
  const spec = { args: {
    a: { 
      name: 'afoo', 
      type: 'freestyle_string'},
    b: {
      name: 'bfoo', 
      type: 'number'},
    c: {
      name: 'cfoo',
      type: 'csv'} } }

  const { getByText, getByLabelText, utils } = renderSetupFromSpec(spec)
  
  // Mocking to return the payload so we can assert we always send
  // correct payload to this endpoint.
  fetchValidation.mockImplementation((payload) => {
    return payload
  })
  fireEvent.click(getByText(MODEL)); // triggers validation
  await waitFor(() => {
    const expectedKeys = ['model_module', 'args'];
    const payload = fetchValidation.mock.results[0].value
    expectedKeys.forEach((key) => {
      expect(Object.keys(payload).includes(key)).toBe(true)
    })
  })
})

test('SetupTab: test dragover of a datastack/logfile', async () => {
  /** Fire a drop event and mock the resolved datastack.
  * This expects batchUpdateArgs to update form values after the drop.
  */
  const spec = {
    args: {
      arg1: { name: 'Workspace', type: 'directory' },
      arg2: { name: 'AOI', type: 'vector' }
    },
    module: `natcap.invest.${MODULE}`
  }
  
  fetchValidation.mockResolvedValue(
    [[Object.keys(spec.args), 'invalid because']])
  
  const mock_datastack = {
    module_name: spec.module,
    args: { arg1: 'circle', arg2: 'square'}
  }
  fetchDatastackFromFile.mockResolvedValue(mock_datastack)

  const { getByText, getByLabelText, utils } = renderSetupFromSpec(spec)
  fireEvent.click(getByText(MODEL));
  const setupForm = await utils.findByTestId('setup-form')

  // This should work but doesn't due to lack of dataTransfer object in jsdom:
  // https://github.com/jsdom/jsdom/issues/1568
  // const dropEvent = new Event('drop', 
  //   { dataTransfer: { files: ['foo.txt'] } 
  // })
  // fireEvent.drop(setupForm, dropEvent)
  
  // Below is a patch similar to the one described here:
  // https://github.com/testing-library/react-testing-library/issues/339
  const fileDropEvent = createEvent.drop(setupForm)
  const fileArray = ['foo.txt']
  Object.defineProperty(fileDropEvent, 'dataTransfer', {
    value: { files : fileArray }
  })
  fireEvent(setupForm, fileDropEvent)

  await waitFor(() => {
    expect(getByLabelText(RegExp(`${spec.args.arg1.name}`)))
      .toHaveValue(mock_datastack.args.arg1)
    expect(getByLabelText(RegExp(`${spec.args.arg2.name}`)))
      .toHaveValue(mock_datastack.args.arg2)
  })
})