import uuid from 'react-native-uuid';

export const generateId = (): string => uuid.v4() as string;
