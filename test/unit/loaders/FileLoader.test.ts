import { FileLoader } from '../../../src/loaders/FileLoader';
import { createMockLogger } from '../testHelpers/mockLogger';

jest.mock('fs');
import fs from 'fs';
import { FileNotFoundError, InvalidSchemaError, ValueNotSetError } from '../../../src';
const mockFs = fs as jest.Mocked<any>;

describe('FileLoader.load', () => {
  it('Will only load file once', async () => {
    const loader = new FileLoader({
      path: 'some/path.json',
      logger: createMockLogger()
    });

    mockFs.existsSync.mockReturnValueOnce(true);
    mockFs.readFileSync.mockReturnValueOnce('{}');
    await loader.load('*');
    await loader.load('*');
    expect(mockFs.existsSync).toHaveBeenCalledTimes(1);
    expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);
  });

  describe('If file not found', () => {
    it('Will throw FileNotFoundError', async ()  => {
      const loader = new FileLoader({
        path: 'some/path.json',
        logger: createMockLogger()
      });
      mockFs.existsSync.mockReturnValueOnce(false);
      await expect(loader.load('*')).rejects.toThrow(FileNotFoundError);
    });
  });

  describe.each([
    '',
    'nope',
    '283910',
    '[]'
  ])('If file is not valid json (%s)', (invalidFileContents) => {
    it('Will throw InvalidSchemaError', async () => {
      const loader = new FileLoader({
        path: 'some/path.json',
        logger: createMockLogger()
      });
      mockFs.existsSync.mockReturnValueOnce(true);
      mockFs.readFileSync.mockReturnValueOnce(invalidFileContents);
      await expect(loader.load('*')).rejects.toThrow(InvalidSchemaError);
    });
  });

  describe('If * requested', () => {
    it('Will resolve the entire config files contents', async () => {
      const loader = new FileLoader({
        path: 'some/path.json',
        logger: createMockLogger()
      });
  
      mockFs.existsSync.mockReturnValueOnce(true);
      mockFs.readFileSync.mockReturnValueOnce('{"key": "value","hello": "world"}');
      await expect(loader.load('*')).resolves.toEqual({
        key: 'value',
        hello: 'world'
      });
    });
  });

  describe('If key requested', () => {
    let loader: FileLoader;
    beforeEach(() => {
      loader = new FileLoader({
        path: 'some/path.json',
        logger: createMockLogger()
      });
      mockFs.existsSync.mockReturnValueOnce(true);
      mockFs.readFileSync.mockReturnValueOnce('{"key": "value","hello": "world"}');
    })
    describe('And it does not exist', () => {
      it('Will throw a ValueNotSetError', async () => {
        await expect(loader.load('nope')).rejects.toThrow(ValueNotSetError)
      });
    });
    describe('And it does exist', () => {
      it('Will resolve the value', async () => {
        await expect(loader.load('hello')).resolves.toEqual('world');
      });
    });
  });

  describe('If the file path is relative', () => {
    it('Will look for the file relative to the current working directory', async () => {
      const loader = new FileLoader({
        path: 'some/path.json',
        logger: createMockLogger()
      });

      mockFs.existsSync.mockReturnValueOnce(true);
      mockFs.readFileSync.mockReturnValueOnce('{}');
      await loader.load('*');
      expect(mockFs.existsSync).toHaveBeenCalledWith(process.cwd() + '/' + 'some/path.json');
      expect(mockFs.readFileSync).toHaveBeenCalledWith(process.cwd() + '/' + 'some/path.json');
    });
  });
  describe('If the file path is absolute', () => {
    it('Will use that absolute path for the file lookup', async () => {
      const loader = new FileLoader({
        path: '/some/absolute/path.json',
        logger: createMockLogger()
      });

      mockFs.existsSync.mockReturnValueOnce(true);
      mockFs.readFileSync.mockReturnValueOnce('{}');
      await loader.load('*');
      expect(mockFs.existsSync).toHaveBeenCalledWith('/some/absolute/path.json');
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/some/absolute/path.json');
    });
  });
});